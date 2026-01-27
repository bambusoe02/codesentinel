import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories, analysisReports } from '@/lib/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { GitHubClient, type GitHubRepository } from '@/lib/github';
import { decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

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

    // Store db in local variable for TypeScript narrow type checking
    const database = db;

    // Get user from database with better error handling
    let user;
    try {
      const userResult = await database
        .select()
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);
      
      user = userResult[0];
      
      if (!user) {
        logger.warn('User not found in repositories route, returning empty array', { clerkId: userId });
        return NextResponse.json({ 
          repositories: [],
          message: 'User not synced. Please refresh the page to sync your account.'
        });
      }
    } catch (dbError: unknown) {
      const error = dbError as { message?: string; code?: string; detail?: string };
      logger.error('Database query failed in repositories route', {
        error: error?.message,
        code: error?.code,
        detail: error?.detail,
        clerkId: userId,
      });
      console.error('Database error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });
      
      // Return empty array instead of error to prevent UI crash
      return NextResponse.json({ 
        repositories: [],
        message: 'Database connection issue. Please try again later.'
      });
    }

    // Log user.id to debug UUID vs TEXT issue
    console.log('User found for repositories query:', {
      userId: user.id,
      userIdType: typeof user.id,
      userIdLength: user.id?.length,
      clerkId: user.clerkId,
    });
    logger.info('User found for repositories query', {
      userId: user.id,
      userIdType: typeof user.id,
      clerkId: user.clerkId,
    });

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
        logger.warn('Failed to decrypt token, using as plain text', { error });
      }
    } else {
      // Fallback to environment token (for backward compatibility)
      githubToken = process.env.GITHUB_TOKEN || null;
    }

    // Get latest analysis for each repository
    const allRepos = await database
      .select()
      .from(repositories)
      .where(eq(repositories.userId, user.id));

    // ✅ OPTIMIZED: Batch query for all analyses instead of N+1 queries
    // Get all analyses for all repos in one query, then group by repository
    const repoIds = allRepos.map(r => r.id);
    const latestAnalysesMap = new Map<number, {
      id: number;
      overallScore: number | null;
      createdAt: Date | null;
      reportData: unknown;
    }>();

    if (repoIds.length > 0) {
      // Use window function to get latest analysis per repository in one query
      // This is more efficient than N separate queries
      const allAnalyses = await database
        .select({
          repositoryId: analysisReports.repositoryId,
          id: analysisReports.id,
          overallScore: analysisReports.overallScore,
          createdAt: analysisReports.createdAt,
          reportData: analysisReports.reportData,
          // Use ROW_NUMBER to identify the latest analysis per repo
          rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${analysisReports.repositoryId} ORDER BY ${analysisReports.createdAt} DESC)`.as('row_num'),
        })
        .from(analysisReports)
        .where(inArray(analysisReports.repositoryId, repoIds));

      // Filter to only the latest analysis per repository (rowNum = 1)
      for (const analysis of allAnalyses) {
        // TypeScript workaround: rowNum is not in the type, but exists at runtime
        const rowNum = (analysis as typeof analysis & { rowNum?: number }).rowNum;
        if (rowNum === 1 && analysis.repositoryId) {
          latestAnalysesMap.set(analysis.repositoryId, {
            id: analysis.id,
            overallScore: analysis.overallScore,
            createdAt: analysis.createdAt,
            reportData: analysis.reportData,
          });
        }
      }
    }

    // Map repos with their latest analysis
    const reposWithAnalysis = allRepos.map((repo) => {
      const latestAnalysis = latestAnalysesMap.get(repo.id);
      
      // Extract owner from fullName (format: "owner/repo")
      const [ownerLogin] = repo.fullName.split('/');
      
      return {
        id: repo.id.toString(), // Convert to string for frontend
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        language: repo.language,
        stargazersCount: repo.stars || 0, // Map stars to stargazersCount
        htmlUrl: repo.htmlUrl,
        owner: {
          login: ownerLogin || '',
          avatar_url: `https://github.com/${ownerLogin}.png`, // Default GitHub avatar
        },
        latestAnalysis: latestAnalysis ? {
          ...latestAnalysis,
          issues: Array.isArray(latestAnalysis.reportData) ? latestAnalysis.reportData : [],
        } : null,
      };
    });

    if (!githubToken) {
      // Return cached repositories from database with analysis info
      return NextResponse.json({ 
        repositories: reposWithAnalysis,
        message: 'No GitHub token configured. Sign in with GitHub OAuth or add your token in Settings.'
      });
    }

    // Fetch from GitHub API
    const githubClient = new GitHubClient(githubToken);
    const githubRepos = await githubClient.getUserRepositories();

    // Sync with database
    const syncedRepos = await Promise.all(
      githubRepos.map(async (repo: GitHubRepository) => {
        const [existing] = await database
          .select()
          .from(repositories)
          .where(eq(repositories.fullName, repo.full_name))
          .limit(1);

        let repoRecord;
        if (existing) {
          // Update existing
          const [updated] = await database
            .update(repositories)
            .set({
              name: repo.name,
              description: repo.description || null,
              htmlUrl: repo.html_url,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language || null,
              isPrivate: repo.private ? 1 : 0,
              updatedAt: new Date(),
            })
            .where(eq(repositories.id, existing.id))
            .returning();

          repoRecord = updated;
        } else {
          // Create new
          const [created] = await database
            .insert(repositories)
            .values({
              userId: user.id,
              githubRepoId: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || null,
              htmlUrl: repo.html_url,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language || null,
              isPrivate: repo.private ? 1 : 0,
            })
            .returning();

          repoRecord = created;
        }

        // Get latest analysis for this repo (single query per repo is acceptable here
        // since we're syncing from GitHub, but we could batch this too if needed)
        const [latestAnalysis] = await database
          .select({
            id: analysisReports.id,
            overallScore: analysisReports.overallScore,
            createdAt: analysisReports.createdAt,
            reportData: analysisReports.reportData,
          })
          .from(analysisReports)
          .where(eq(analysisReports.repositoryId, repoRecord.id))
          .orderBy(desc(analysisReports.createdAt))
          .limit(1);

        // Extract owner from fullName (format: "owner/repo")
        const [ownerLogin] = repoRecord.fullName.split('/');
        
        return {
          id: repoRecord.id.toString(), // Convert to string for frontend
          name: repoRecord.name,
          fullName: repoRecord.fullName,
          description: repoRecord.description,
          language: repoRecord.language,
          stargazersCount: repoRecord.stars || 0, // Map stars to stargazersCount
          htmlUrl: repoRecord.htmlUrl,
          owner: {
            login: ownerLogin || '',
            avatar_url: `https://github.com/${ownerLogin}.png`, // Default GitHub avatar
          },
          latestAnalysis: latestAnalysis ? {
            ...latestAnalysis,
            issues: Array.isArray(latestAnalysis.reportData) ? latestAnalysis.reportData : [],
          } : null,
        };
      })
    );

    return NextResponse.json({ repositories: syncedRepos });
  } catch (error) {
    logger.error('Error fetching repositories', error);
    
    // Fallback to database cache
    try {
      const { userId } = await auth();
      if (userId && db) {
        const database = db; // Local variable for TypeScript narrow type checking
        const [user] = await database
          .select()
          .from(users)
          .where(eq(users.clerkId, userId))
          .limit(1);

        if (user) {
          const cachedRepos = await database
            .select()
            .from(repositories)
            .where(eq(repositories.userId, user.id));

          // ✅ OPTIMIZED: Batch query for all analyses instead of N+1 queries
          const cachedRepoIds = cachedRepos.map(r => r.id);
          const cachedLatestAnalysesMap = new Map<number, {
            id: number;
            overallScore: number | null;
            createdAt: Date | null;
            reportData: unknown;
          }>();

          if (cachedRepoIds.length > 0) {
            const allCachedAnalyses = await database
              .select({
                repositoryId: analysisReports.repositoryId,
                id: analysisReports.id,
                overallScore: analysisReports.overallScore,
                createdAt: analysisReports.createdAt,
                reportData: analysisReports.reportData,
                rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${analysisReports.repositoryId} ORDER BY ${analysisReports.createdAt} DESC)`.as('row_num'),
              })
              .from(analysisReports)
              .where(inArray(analysisReports.repositoryId, cachedRepoIds));

            for (const analysis of allCachedAnalyses) {
              const rowNum = (analysis as typeof analysis & { rowNum?: number }).rowNum;
              if (rowNum === 1 && analysis.repositoryId) {
                cachedLatestAnalysesMap.set(analysis.repositoryId, {
                  id: analysis.id,
                  overallScore: analysis.overallScore,
                  createdAt: analysis.createdAt,
                  reportData: analysis.reportData,
                });
              }
            }
          }

          // Map repos with their latest analysis
          const reposWithAnalysis = cachedRepos.map((repo) => {
            const latestAnalysis = cachedLatestAnalysesMap.get(repo.id);
            return {
              ...repo,
              latestAnalysis: latestAnalysis ? {
                ...latestAnalysis,
                issues: Array.isArray(latestAnalysis.reportData) ? latestAnalysis.reportData : [],
              } : null,
            };
          });

          return NextResponse.json({ repositories: reposWithAnalysis });
        }
      }
    } catch (fallbackError) {
      logger.error('Fallback error', fallbackError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
