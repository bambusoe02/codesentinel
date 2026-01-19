import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, analysisReports, repositories } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if database is available
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured', activities: [] },
        { status: 500 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent analysis reports with repository info
    const reports = await db
      .select({
        id: analysisReports.id,
        repositoryName: repositories.name,
        repositoryFullName: repositories.fullName,
        overallScore: analysisReports.overallScore,
        createdAt: analysisReports.createdAt,
        issues: analysisReports.issues,
      })
      .from(analysisReports)
      .innerJoin(repositories, eq(analysisReports.repositoryId, repositories.id))
      .where(eq(analysisReports.userId, user.id))
      .orderBy(desc(analysisReports.createdAt))
      .limit(10);

    return NextResponse.json({ activities: reports });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
