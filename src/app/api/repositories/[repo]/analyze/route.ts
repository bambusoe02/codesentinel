import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories, analysisReports } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { parseDbError } from '@/lib/error-parser';
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
    // Use a more defensive approach: try with isAIPowered, fallback to without it on ANY error
    let report;
    const isAIPoweredValue = analysisResult.isAIPowered === true ? 1 : 0;

    // Validate and prepare JSONB data
    const reportData = analysisResult.issues || [];
    const recommendations = analysisResult.recommendations || [];
    
    // Check JSONB size (PostgreSQL JSONB has ~1GB limit, but we'll be conservative)
    const reportDataSize = JSON.stringify(reportData).length;
    const recommendationsSize = JSON.stringify(recommendations).length;
    const maxJsonbSize = 10 * 1024 * 1024; // 10MB limit
    
    if (reportDataSize > maxJsonbSize) {
      logger.warn('Report data too large, truncating', {
        originalSize: reportDataSize,
        maxSize: maxJsonbSize,
        issuesCount: reportData.length,
      });
      // Keep only first 100 issues if too large
      reportData.splice(100);
    }
    
    if (recommendationsSize > maxJsonbSize) {
      logger.warn('Recommendations too large, truncating', {
        originalSize: recommendationsSize,
        maxSize: maxJsonbSize,
        recommendationsCount: recommendations.length,
      });
      recommendations.splice(50); // Keep only first 50 recommendations
    }

    logger.info('Saving analysis report', {
      overallScore: analysisResult.overallScore,
      issuesCount: reportData.length,
      recommendationsCount: recommendations.length,
      reportDataSize,
      recommendationsSize,
      isAIPowered: isAIPoweredValue,
    });

    // Note: shareToken column doesn't exist in database, so we skip generation
    // If you need share tokens, add the column first:
    // ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS share_token TEXT;

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
        reportDataLength: reportData.length,
        recommendationsLength: recommendations.length,
        reportDataSize,
        recommendationsSize,
        // shareToken: shareToken, // ❌ Column doesn't exist in database
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
         reportData: reportData,
         recommendations: recommendations,
         // shareToken: shareToken, // ❌ Column doesn't exist in database - removed
         isAiPowered: isAIPoweredValue, // ✅ Column exists in database (NOT NULL, default 0)
         // id: auto-generated (serial)
         // createdAt: auto-generated (defaultNow)
         // analysisDate: auto-generated (defaultNow)
      })
      .returning({
        id: analysisReports.id,
        userId: analysisReports.userId,
        repositoryId: analysisReports.repositoryId,
        overallScore: analysisReports.overallScore,
        securityScore: analysisReports.securityScore,
        qualityScore: analysisReports.qualityScore,
        performanceScore: analysisReports.performanceScore,
        maintainabilityScore: analysisReports.maintainabilityScore,
        techDebtScore: analysisReports.techDebtScore,
        reportData: analysisReports.reportData,
        recommendations: analysisReports.recommendations,
        // shareToken: analysisReports.shareToken, // ❌ Column doesn't exist in database
        isAiPowered: analysisReports.isAiPowered, // ✅ Column exists in database
        createdAt: analysisReports.createdAt,
      });

      console.log('✅ Analysis report saved successfully (first attempt)');
      
      // Check if isAiPowered was returned (column might not exist)
      const reportIsAiPowered = (report as { isAiPowered?: number }).isAiPowered ?? isAIPoweredValue;
      
      logger.info('Analysis report saved successfully with isAiPowered', {
        reportId: report.id,
        isAiPowered: reportIsAiPowered,
        isAiPoweredInResponse: 'isAiPowered' in report,
      });
    } catch (firstError: unknown) {
      // Parse error using utility function
      const parsedError = parseDbError(firstError);
      const errorCode = parsedError.code || '';
      const errorDetail = parsedError.detail || '';
      const errorConstraint = parsedError.constraint || '';
      const errorMessage = parsedError.message || 'Unknown error';
      const errorHint = parsedError.hint || '';

      console.error('=== FIRST INSERT ATTEMPT FAILED ===');
      console.error('Error message:', errorMessage);
      console.error('Error code:', errorCode);
      console.error('Error detail:', errorDetail);
      console.error('Error constraint:', errorConstraint);
      console.error('Error hint:', errorHint);
      console.error('Full error object:', JSON.stringify(firstError, null, 2));

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
          reportDataLength: reportData.length,
          recommendationsLength: recommendations.length,
          // shareToken: shareToken, // ❌ Column doesn't exist in database
        });

        // Retry with minimal fields and explicit returning to avoid non-existent columns
        [report] = await db
        .insert(analysisReports)
        .values({
          userId: user.id, // ✅ REQUIRED - must be included
          repositoryId: repo.id,
          overallScore: analysisResult.overallScore,
          // Omit optional score fields - they may not exist in DB
          reportData: reportData,
          recommendations: recommendations,
          // shareToken: shareToken, // ❌ Column doesn't exist in database - removed
          isAiPowered: isAIPoweredValue, // ✅ Column exists in database (NOT NULL, default 0)
        })
        .returning({
          id: analysisReports.id,
          userId: analysisReports.userId,
          repositoryId: analysisReports.repositoryId,
          overallScore: analysisReports.overallScore,
          reportData: analysisReports.reportData,
          recommendations: analysisReports.recommendations,
          // shareToken: analysisReports.shareToken, // ❌ Column doesn't exist in database - removed
          isAiPowered: analysisReports.isAiPowered, // ✅ Column exists in database
          createdAt: analysisReports.createdAt,
        });

        console.log('✅ Analysis report saved successfully (second attempt)');
        // isAiPowered column doesn't exist, so it won't be in the response
        // Use the value we tried to insert
        logger.info('Analysis report saved successfully without optional fields (using defaults)', {
          reportId: report.id,
          isAiPowered: isAIPoweredValue, // Use the value we intended to insert
          note: 'is_ai_powered column may not exist in database',
        });
      } catch (retryError: unknown) {
        // Parse retry error using utility function
        const retryParsed = parseDbError(retryError);
        const retryCode = retryParsed.code || '';
        const retryDetail = retryParsed.detail || '';
        const retryConstraint = retryParsed.constraint || '';
        const retryMessage = retryParsed.message || 'Unknown error';
        
        console.error('=== BOTH INSERT ATTEMPTS FAILED ===');
        console.error('First attempt error:', errorMessage);
        console.error('First attempt code:', errorCode);
        console.error('First attempt detail:', errorDetail);
        console.error('First attempt constraint:', errorConstraint);
        console.error('Retry attempt error:', retryMessage);
        console.error('Retry error code:', retryCode);
        console.error('Retry error detail:', retryDetail);
        console.error('Retry error constraint:', retryConstraint);
        console.error('Full retry error object:', JSON.stringify(retryError, null, 2));
        
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

    // Verify that report was actually saved to database
    if (!report || !report.id) {
      logger.error('Analysis report was not saved despite successful insert', {
        report,
        analysisResult: {
          overallScore: analysisResult.overallScore,
          issuesCount: reportData.length,
        },
      });
      return NextResponse.json(
        { 
          error: 'Analysis completed but failed to save results',
          details: 'Please try again or contact support if the problem persists'
        },
        { status: 500 }
      );
    }

    // Double-check by querying the database
    try {
      const [verifiedReport] = await db
        .select({ id: analysisReports.id })
        .from(analysisReports)
        .where(eq(analysisReports.id, report.id))
        .limit(1);

      if (!verifiedReport) {
        logger.error('Analysis report not found in database after insert', {
          reportId: report.id,
        });
        return NextResponse.json(
          { 
            error: 'Analysis completed but results were not saved',
            details: 'Please try again'
          },
          { status: 500 }
        );
      }
    } catch (verifyError) {
      logger.error('Failed to verify analysis report in database', verifyError);
      // Don't fail the request if verification fails - report was already inserted
    }

    logger.info('Analysis completed and verified successfully', {
      reportId: report.id,
      overallScore: analysisResult.overallScore,
      isAIPowered: isAIPoweredValue,
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      analysis: analysisResult,
      isAIPowered: analysisResult.isAIPowered ?? false,
      message: 'Analysis completed successfully',
    });
  } catch (error) {
    logger.error('Error analyzing repository', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
