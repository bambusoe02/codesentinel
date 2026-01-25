import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories, analysisReports } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(
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
      
      logger.error('Repository not found in results', new Error('Repository not found'), {
        requested: repoFullName,
        available: allUserRepos.map(r => r.fullName),
        userId: user.id,
      });

      return NextResponse.json({ 
        error: 'Repository not found',
        details: `Looking for: ${repoFullName}`
      }, { status: 404 });
    }

    // Get latest analysis report
    let reports;
    try {
      reports = await db
        .select()
        .from(analysisReports)
        .where(eq(analysisReports.repositoryId, repo.id))
        .orderBy(desc(analysisReports.createdAt))
        .limit(1);
    } catch (dbError: unknown) {
      const error = dbError as { message?: string; code?: string };
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';
      
      // Check if error is related to is_ai_powered column
      const isColumnError = 
        errorMessage.includes('is_ai_powered') ||
        errorMessage.includes('isAIPowered') ||
        errorCode === '42703' || // undefined_column
        errorCode === '42P01'; // undefined_table
      
      if (isColumnError) {
        logger.warn('is_ai_powered column does not exist in database, using default value', {
          error: errorMessage,
          code: errorCode,
        });
        // Return error indicating database schema needs update
        return NextResponse.json({ 
          error: 'Database schema mismatch',
          details: 'The is_ai_powered column does not exist in the database. Please run database migrations.',
          code: 'SCHEMA_MISMATCH',
        }, { status: 500 });
      } else {
        // Re-throw if it's a different error
        logger.error('Database query failed', dbError);
        throw dbError;
      }
    }

    if (reports.length === 0) {
      logger.info('No analysis found for repository', {
        repoFullName,
        repositoryId: repo.id,
        userId: user.id,
      });
      return NextResponse.json({ 
        error: 'No analysis found',
        code: 'ANALYSIS_NOT_FOUND',
        message: 'Analysis has not been run yet or is still in progress',
      }, { status: 404 });
    }

    const report = reports[0];
    
    // Ensure isAIPowered is included in response
    // Handle integer (0/1) from database - convert to number
    // If column doesn't exist or is null, default to 0
    const isAIPoweredValue = (report.isAIPowered !== undefined && report.isAIPowered !== null) 
      ? (report.isAIPowered === 1 ? 1 : 0)
      : 0;
    
    logger.info('Returning analysis report', {
      reportId: report.id,
      isAIPowered: report.isAIPowered,
      isAIPoweredType: typeof report.isAIPowered,
      isAIPoweredValue,
      overallScore: report.overallScore,
      createdAt: report.createdAt,
    });

    return NextResponse.json({ 
      report: {
        ...report,
        isAIPowered: isAIPoweredValue, // Ensure it's always a number (0 or 1)
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Ensure fresh data
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    logger.error('Error fetching analysis results', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis results' },
      { status: 500 }
    );
  }
}
