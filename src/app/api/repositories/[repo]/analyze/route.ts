import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories, analysisReports } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { CodeAnalyzer } from '@/lib/analyzer';
import { decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

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
    // Use a more defensive approach: try with isAIPowered, fallback to without it on ANY error
    let report;
    const isAIPoweredValue = analysisResult.isAIPowered === true ? 1 : 0;

    logger.info('Saving analysis report', {
      overallScore: analysisResult.overallScore,
      issuesCount: analysisResult.issues?.length || 0,
      isAIPowered: isAIPoweredValue,
    });

    // Generate share token for public sharing
    const shareToken = randomUUID().substring(0, 8);

    // First attempt: try with all fields including isAIPowered
    // Note: id and createdAt are auto-generated (serial and defaultNow)
    // qualityScore uses maintainabilityScore as fallback (they're similar concepts)
    try {
      // Validate required fields before insert
      if (!analysisResult.overallScore && analysisResult.overallScore !== 0) {
        throw new Error('overallScore is required but was null/undefined');
      }

      console.log('=== ATTEMPTING ANALYSIS INSERT (FIRST ATTEMPT) ===');
      console.log('Insert values:', {
        userId: user.id,
        repositoryId: repo.id,
        overallScore: analysisResult.overallScore,
        securityScore: analysisResult.securityScore ?? null,
        qualityScore: analysisResult.maintainabilityScore ?? null,
        performanceScore: analysisResult.performanceScore ?? null,
        maintainabilityScore: analysisResult.maintainabilityScore ?? null,
        techDebtScore: analysisResult.techDebtScore ?? null,
        reportDataLength: analysisResult.issues?.length || 0,
        recommendationsLength: analysisResult.recommendations?.length || 0,
        shareToken: shareToken,
        isAiPowered: isAIPoweredValue,
      });

      [report] = await db
       .insert(analysisReports)
       .values({
         userId: user.id,
         repositoryId: repo.id,
         overallScore: analysisResult.overallScore,
         securityScore: analysisResult.securityScore ?? null,
         qualityScore: analysisResult.maintainabilityScore ?? null, // Use maintainability as quality fallback
         performanceScore: analysisResult.performanceScore ?? null,
         maintainabilityScore: analysisResult.maintainabilityScore ?? null,
         techDebtScore: analysisResult.techDebtScore ?? null,
         reportData: analysisResult.issues || [],
         recommendations: analysisResult.recommendations || [],
         shareToken: shareToken,
         isAiPowered: isAIPoweredValue,
         // id: auto-generated (serial)
         // createdAt: auto-generated (defaultNow)
         // analysisDate: auto-generated (defaultNow)
      })
      .returning();

      console.log('✅ Analysis report saved successfully (first attempt)');
      logger.info('Analysis report saved successfully with isAiPowered', {
        reportId: report.id,
        isAiPowered: report.isAiPowered,
      });
    } catch (firstError: unknown) {
      // Log the error for debugging
      // NeonDbError has nested structure: error.cause contains the actual error details
      const error = firstError as {
        message?: string;
        code?: string;
        constraint?: string;
        detail?: string;
        hint?: string;
        cause?: {
          code?: string;
          detail?: string;
          constraint?: string;
          message?: string;
          name?: string;
        };
      };
      
      // Extract error details from nested cause (NeonDbError structure)
      const errorCode = error?.code || error?.cause?.code || '';
      const errorDetail = error?.detail || error?.cause?.detail || '';
      const errorConstraint = error?.constraint || error?.cause?.constraint || '';
      const errorMessage = error?.message || error?.cause?.message || 'Unknown error';
      const errorHint = error?.hint || '';

      console.error('=== FIRST INSERT ATTEMPT FAILED ===');
      console.error('Error message:', errorMessage);
      console.error('Error code:', errorCode);
      console.error('Error detail:', errorDetail);
      console.error('Error constraint:', errorConstraint);
      console.error('Error hint:', errorHint);
      console.error('Error cause:', error?.cause);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      logger.warn('First insert attempt failed, retrying without optional fields', {
        message: errorMessage,
        code: errorCode,
        detail: errorDetail,
        constraint: errorConstraint,
        hint: errorHint,
      });

      // Retry without optional fields - let database use defaults
      // This handles ANY error, not just column-related ones
      try {
        // Validate required fields before retry
        if (!analysisResult.overallScore && analysisResult.overallScore !== 0) {
          throw new Error('overallScore is required but was null/undefined');
        }

        console.log('=== RETRYING INSERT (SECOND ATTEMPT - MINIMAL FIELDS) ===');
        console.log('Retry values:', {
          userId: user.id,
          repositoryId: repo.id,
          overallScore: analysisResult.overallScore,
          reportDataLength: analysisResult.issues?.length || 0,
          recommendationsLength: analysisResult.recommendations?.length || 0,
          shareToken: shareToken,
        });

        [report] = await db
        .insert(analysisReports)
        .values({
          userId: user.id, // ✅ REQUIRED - must be included
          repositoryId: repo.id,
          overallScore: analysisResult.overallScore,
          // Omit optional score fields - they may not exist in DB
          reportData: analysisResult.issues || [],
          recommendations: analysisResult.recommendations || [],
          shareToken: shareToken, // Still include shareToken as it's useful
          // Omit isAiPowered - let database use default (0)
        })
        .returning();

        console.log('✅ Analysis report saved successfully (second attempt)');
        logger.info('Analysis report saved successfully without optional fields (using defaults)', {
          reportId: report.id,
          isAiPowered: report.isAiPowered ?? 0,
        });
      } catch (retryError: unknown) {
        // Parse retry error with nested cause structure
        const retryErr = retryError as { 
          message?: string; 
          code?: string; 
          detail?: string; 
          constraint?: string;
          cause?: {
            code?: string;
            detail?: string;
            constraint?: string;
            message?: string;
          };
        };
        
        // Extract from nested cause if available
        const retryCode = retryErr?.code || retryErr?.cause?.code || '';
        const retryDetail = retryErr?.detail || retryErr?.cause?.detail || '';
        const retryConstraint = retryErr?.constraint || retryErr?.cause?.constraint || '';
        const retryMessage = retryErr?.message || retryErr?.cause?.message || 'Unknown error';
        
        console.error('=== BOTH INSERT ATTEMPTS FAILED ===');
        console.error('First attempt error:', errorMessage);
        console.error('First attempt code:', errorCode);
        console.error('First attempt detail:', errorDetail);
        console.error('First attempt constraint:', errorConstraint);
        console.error('Retry attempt error:', retryMessage);
        console.error('Retry error code:', retryCode);
        console.error('Retry error detail:', retryDetail);
        console.error('Retry error constraint:', retryConstraint);
        console.error('Retry error cause:', retryErr?.cause);
        console.error('Full retry error object:', JSON.stringify(retryErr, null, 2));
        
        logger.error('Both insert attempts failed', {
          firstAttempt: {
            message: errorMessage,
            code: errorCode,
            detail: errorDetail,
            constraint: errorConstraint,
          },
          retryAttempt: {
            message: retryMessage,
            code: retryCode,
            detail: retryDetail,
            constraint: retryConstraint,
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to save analysis results',
            details: `Database insert failed. First attempt: ${errorMessage} (code: ${errorCode || 'N/A'}, detail: ${errorDetail || 'N/A'}). Retry attempt: ${retryMessage} (code: ${retryCode || 'N/A'}, detail: ${retryDetail || 'N/A'})`,
            code: 'DATABASE_INSERT_FAILED',
            firstAttempt: {
              message: errorMessage,
              code: errorCode,
              detail: errorDetail,
              constraint: errorConstraint,
            },
            retryAttempt: {
              message: retryMessage,
              code: retryCode,
              detail: retryDetail,
              constraint: retryConstraint,
            },
          },
          { status: 500 }
        );
      }
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
