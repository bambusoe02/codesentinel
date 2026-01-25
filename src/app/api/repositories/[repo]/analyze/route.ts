import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories, analysisReports } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { CodeAnalyzer } from '@/lib/analyzer';
import { decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repo: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if database is available
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { repo: repoParam } = await params;
    const repoFullName = decodeURIComponent(repoParam);

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get repository from database
    const [repo] = await db
      .select()
      .from(repositories)
      .where(and(
        eq(repositories.userId, user.id),
        eq(repositories.fullName, repoFullName)
      ))
      .limit(1);

    if (!repo) {
      // Get all user repos for debugging
      const allUserRepos = await db
        .select({ fullName: repositories.fullName })
        .from(repositories)
        .where(eq(repositories.userId, user.id));
      
      logger.error('Repository not found in analyze', new Error('Repository not found'), {
        requested: repoFullName,
        available: allUserRepos.map(r => r.fullName),
        userId: user.id,
      });

      return NextResponse.json({ 
        error: 'Repository not found',
        details: `Looking for: ${repoFullName}. Available repos: ${allUserRepos.map(r => r.fullName).join(', ')}`
      }, { status: 404 });
    }

    // Try to get GitHub token from user's stored token (decrypt if encrypted), fallback to environment
    let githubToken: string | null = null;
    
    if (user.githubToken) {
      try {
        // Try to decrypt (if encrypted)
        githubToken = decrypt(user.githubToken);
      } catch (error) {
        // If decryption fails, token might be plain text (backward compatibility)
        githubToken = user.githubToken;
        logger.warn('Failed to decrypt token, using as plain text', { error });
      }
    } else {
      githubToken = process.env.GITHUB_TOKEN || null;
    }
    
    if (!githubToken) {
      return NextResponse.json({ 
        error: 'GitHub token not configured. Sign in with GitHub OAuth or add your token in Settings.'
      }, { status: 500 });
    }

    const [owner, name] = repoFullName.split('/');
    const githubClient = new GitHubClient(githubToken);

    // Fetch repository data
    const [, stats, commits] = await Promise.all([
      githubClient.getRepository(owner, name), // Validated but not used directly
      githubClient.getRepositoryStats(owner, name),
      githubClient.getRepositoryCommits(owner, name, undefined, undefined, 30),
    ]);

    // Get repository files
    const allFiles = await githubClient.getRepositoryContents(owner, name);

    // Analyze code
    const analyzer = new CodeAnalyzer(
      repoFullName,
      allFiles,
      stats,
      commits
    );

    let analysisResult;
    try {
      analysisResult = await analyzer.analyze();
    } catch (analysisError) {
      logger.error('Analysis failed completely', analysisError);
      return NextResponse.json(
        {
          error: 'Failed to analyze repository',
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Save analysis report to database
    let report;
    try {
      // Ensure isAIPowered is always a number (0 or 1)
      const isAIPoweredValue = analysisResult.isAIPowered === true ? 1 : 0;
      
      logger.info('Saving analysis report', {
        overallScore: analysisResult.overallScore,
        issuesCount: analysisResult.issues?.length || 0,
        isAIPowered: isAIPoweredValue,
        isAIPoweredOriginal: analysisResult.isAIPowered,
      });

      try {
        // First attempt: try with isAIPowered
        [report] = await db
          .insert(analysisReports)
          .values({
            userId: user.id,
            repositoryId: repo.id,
            overallScore: analysisResult.overallScore,
            issues: analysisResult.issues || [],
            recommendations: analysisResult.recommendations || [],
            isAIPowered: isAIPoweredValue,
          })
          .returning();
        
        logger.info('Analysis report saved successfully with isAIPowered', {
          reportId: report.id,
          isAIPowered: report.isAIPowered,
        });
      } catch (firstError: unknown) {
        const error = firstError as { message?: string; code?: string; constraint?: string };
        const errorMessage = error?.message || '';
        const errorCode = error?.code || '';
        
        // Check if error is related to is_ai_powered column
        const isColumnError = 
          errorMessage.includes('is_ai_powered') ||
          errorMessage.includes('isAIPowered') ||
          errorCode === '42703' || // undefined_column
          errorCode === '42P01' || // undefined_table
          error?.constraint?.includes('is_ai_powered');
        
        if (isColumnError) {
          logger.warn('is_ai_powered column issue detected, retrying without it', {
            error: errorMessage,
            code: errorCode,
          });
          
          // Retry without isAIPowered - let database use default
          [report] = await db
            .insert(analysisReports)
            .values({
              userId: user.id,
              repositoryId: repo.id,
              overallScore: analysisResult.overallScore,
              issues: analysisResult.issues || [],
              recommendations: analysisResult.recommendations || [],
              // Omit isAIPowered - let database use default (0)
            })
            .returning();
          
          logger.info('Analysis report saved successfully without isAIPowered (using default)', {
            reportId: report.id,
            isAIPowered: report.isAIPowered,
          });
        } else {
          // Re-throw if it's a different error
          throw firstError;
        }
      }
    } catch (dbError) {
      logger.error('Failed to save analysis report to database', dbError);
      const errorDetails = dbError instanceof Error ? dbError.message : 'Database error';
      return NextResponse.json(
        {
          error: 'Failed to save analysis results',
          details: errorDetails,
          stack: process.env.NODE_ENV === 'development' && dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      analysis: analysisResult,
      isAIPowered: analysisResult.isAIPowered ?? false,
    });
  } catch (error) {
    logger.error('Error analyzing repository', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
