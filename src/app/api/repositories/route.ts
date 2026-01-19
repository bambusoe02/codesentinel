import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if database is available
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured', repositories: [] },
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

    // Try to get GitHub token from environment or user's stored token
    // In production, you'd get this from Clerk session or user's stored token
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      // Return cached repositories from database
      const cachedRepos = await db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, user.id));

      return NextResponse.json({ repositories: cachedRepos });
    }

    // Fetch from GitHub API
    const githubClient = new GitHubClient(githubToken);
    const githubRepos = await githubClient.getUserRepositories();

    // Sync with database
    const syncedRepos = await Promise.all(
      githubRepos.map(async (repo) => {
        const [existing] = await db
          .select()
          .from(repositories)
          .where(eq(repositories.fullName, repo.full_name))
          .limit(1);

        if (existing) {
          // Update existing
          const [updated] = await db
            .update(repositories)
            .set({
              name: repo.name,
              description: repo.description || null,
              htmlUrl: repo.html_url,
              owner: repo.owner,
              stargazersCount: repo.stargazers_count,
              language: repo.language || null,
              topics: (repo as any).topics || [],
              updatedAt: new Date(),
            })
            .where(eq(repositories.id, existing.id))
            .returning();

          return updated;
        } else {
          // Create new
          const [created] = await db
            .insert(repositories)
            .values({
              userId: user.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || null,
              htmlUrl: repo.html_url,
              owner: repo.owner,
              stargazersCount: repo.stargazers_count,
              language: repo.language || null,
              topics: (repo as any).topics || [],
            })
            .returning();

          return created;
        }
      })
    );

    return NextResponse.json({ repositories: syncedRepos });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    
    // Fallback to database cache
    try {
      const { userId } = await auth();
      if (userId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, userId))
          .limit(1);

        if (user) {
          const cachedRepos = await db
            .select()
            .from(repositories)
            .where(eq(repositories.userId, user.id));

          return NextResponse.json({ repositories: cachedRepos });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
