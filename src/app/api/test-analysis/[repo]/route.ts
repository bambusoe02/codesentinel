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

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { repo: repoParam } = await params;
    const repoFullName = decodeURIComponent(repoParam);

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get repository
    const [repo] = await db
      .select()
      .from(repositories)
      .where(and(
        eq(repositories.userId, user.id),
        eq(repositories.fullName, repoFullName)
      ))
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Get latest analysis report
    const reports = await db
      .select()
      .from(analysisReports)
      .where(eq(analysisReports.repositoryId, repo.id))
      .orderBy(desc(analysisReports.createdAt))
      .limit(1);

    if (reports.length === 0) {
      return NextResponse.json({ 
        message: 'No analysis found',
        suggestion: 'Run a new analysis first',
      });
    }

    const report = reports[0];

    return NextResponse.json({
      reportId: report.id,
      isAIPowered: report.isAIPowered,
      isAIPoweredType: typeof report.isAIPowered,
      isAIPoweredValue: report.isAIPowered === 1 ? 'AI' : report.isAIPowered === 0 ? 'Rule-based' : 'Unknown',
      createdAt: report.createdAt,
      overallScore: report.overallScore,
      issuesCount: Array.isArray(report.issues) ? report.issues.length : 0,
      message: report.isAIPowered === 1 
        ? '✅ This analysis was AI-powered' 
        : report.isAIPowered === 0 
        ? '📋 This analysis was rule-based' 
        : '⚠️ Unknown analysis type',
    });
  } catch (error) {
    logger.error('Test analysis route error', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

