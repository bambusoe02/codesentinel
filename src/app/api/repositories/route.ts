import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { GitHubClient, type GitHubRepository } from '@/lib/github';
import { decrypt } from '@/lib/encryption';

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

    // Try to get GitHub token from user's stored token (decrypt if encrypted), fallback to environment
    let githubToken: string | null = null;
    
    if (user.githubToken) {
      try {
        // Try to decrypt (if encrypted) - if it fails, assume it's plain text (for backward compatibility)
        githubToken = decrypt(user.githubToken);
      } catch (error) {
        // If decryption fails, token might be plain text or corrupted
        // Try using it as-is (for backward compatibility with non-encrypted tokens)
        githubToken = user.githubToken;
        console.warn('Failed to decrypt token, using as plain text:', error);
      }
    } else {
      // Fallback to environment token (for backward compatibility)
      githubToken = process.env.GITHUB_TOKEN || null;
    }

    if (!githubToken) {
      // Return cached repositories from database
      const cachedRepos = await db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, user.id));

      return NextResponse.json({ 
        repositories: cachedRepos,
        message: 'No GitHub token configured. Sign in with GitHub OAuth or add your token in Settings.'
      });
    }

    // Fetch from GitHub API
    const githubClient = new GitHubClient(githubToken);
    const githubRepos = await githubClient.getUserRepositories();

    // Sync with database
    const syncedRepos = await Promise.all(
      githubRepos.map(async (repo: GitHubRepository) => {
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
              topics: repo.topics || [],
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
              topics: repo.topics || [],
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
