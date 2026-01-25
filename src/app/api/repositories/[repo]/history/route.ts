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
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { repo: repoParam } = await params;
    const repoFullName = decodeURIComponent(repoParam);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const range = searchParams.get('range') || 'all'; // '7d', '30d', 'all'

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
      return NextResponse.json({ 
        error: 'Repository not found'
      }, { status: 404 });
    }

    // Get analysis reports
    const reports = await db
      .select()
      .from(analysisReports)
      .where(eq(analysisReports.repositoryId, repo.id))
      .orderBy(desc(analysisReports.createdAt))
      .limit(limit + offset) // Fetch more to account for filtering
      .offset(0);

    // Calculate date filter based on range
    let dateFilter: Date | null = null;
    if (range === '7d') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (range === '30d') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // Filter by date if needed (client-side since Drizzle date filtering is complex)
    let filteredReports = reports;
    if (dateFilter) {
      filteredReports = reports.filter(
        (report) => new Date(report.createdAt) >= dateFilter!
      );
    }

    // Apply limit and offset after filtering
    filteredReports = filteredReports.slice(offset, offset + limit);

    // Format response
    // Use database columns if available, otherwise calculate from issues
    const history = filteredReports.map((report) => {
      const reportWithScores = report as typeof report & {
        securityScore?: number | null;
        performanceScore?: number | null;
        maintainabilityScore?: number | null;
        techDebtScore?: number | null;
      };
      
      // Access reportData field (renamed from issues)
      const reportData = (report as typeof report & { reportData?: unknown[] }).reportData || [];
      
      return {
        id: report.id,
        overallScore: report.overallScore,
        issues: Array.isArray(reportData) ? reportData : [],
        recommendations: report.recommendations || [],
        createdAt: report.createdAt,
        // Use database columns if available, otherwise calculate from reportData
        securityScore: reportWithScores.securityScore ?? calculateCategoryScore(Array.isArray(reportData) ? reportData : [], 'security'),
        performanceScore: reportWithScores.performanceScore ?? calculateCategoryScore(Array.isArray(reportData) ? reportData : [], 'performance'),
        maintainabilityScore: reportWithScores.maintainabilityScore ?? calculateCategoryScore(Array.isArray(reportData) ? reportData : [], 'maintainability'),
        techDebtScore: reportWithScores.techDebtScore ?? null,
        reliabilityScore: calculateCategoryScore(Array.isArray(reportData) ? reportData : [], 'reliability'),
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error('Error fetching analysis history', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis history' },
      { status: 500 }
    );
  }
}

// Helper function to calculate category score from issues
function calculateCategoryScore(
  issues: Array<{ type: string; severity: string }>,
  category: string
): number {
  const categoryIssues = issues.filter(
    (issue) => issue.type === category
  );

  if (categoryIssues.length === 0) {
    return 100; // Perfect score if no issues
  }

  // Calculate penalty based on severity
  let penalty = 0;
  categoryIssues.forEach((issue) => {
    switch (issue.severity) {
      case 'critical':
        penalty += 15;
        break;
      case 'high':
        penalty += 10;
        break;
      case 'medium':
        penalty += 5;
        break;
      case 'low':
        penalty += 2;
        break;
    }
  });

  return Math.max(0, 100 - Math.min(penalty, 100));
}
