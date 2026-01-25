import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, repositories, analysisReports } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { encrypt, isEncryptionConfigured } from '@/lib/encryption';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if database is available
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Extract GitHub username from external accounts
    const githubAccount = clerkUser.externalAccounts?.find(
      (acc: { provider: string }) => acc.provider === 'oauth_github'
    );
    const githubUsername = githubAccount
      ? (githubAccount as { username?: string }).username || null
      : null;

    // Try to get GitHub OAuth token from Clerk (automatic)
    let encryptedGitHubToken: string | null = null;
    try {
      if (githubAccount && isEncryptionConfigured()) {
        const oauthTokens = await clerk.users.getUserOauthAccessToken(
          userId,
          'oauth_github'
        );
        
        const githubToken = oauthTokens.data?.[0]?.token;
        
        if (githubToken) {
          // Encrypt token before storing
          encryptedGitHubToken = encrypt(githubToken);
          logger.info('Successfully retrieved and encrypted GitHub token from Clerk');
        }
      }
    } catch (error) {
      // Token might not be available (e.g., user didn't sign in via GitHub OAuth)
      // This is not critical - user can still add token manually in Settings
      logger.warn('Could not retrieve GitHub OAuth token from Clerk', { error });
    }

    // Validate email
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      logger.error('User email is missing', { userId, clerkUser: { id: clerkUser.id } });
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in database (for UUID migration)
    console.log('Checking for existing user with clerkId:', userId);
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    // If user exists with UUID as id, migrate to Clerk userId
    if (existingUser.length > 0) {
      const existingUserRecord = existingUser[0];
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingUserRecord.id);
      
      if (isUUID && existingUserRecord.clerkId === userId) {
        console.log('Migrating user.id from UUID to Clerk userId:', {
          oldId: existingUserRecord.id,
          newId: userId,
        });
        
        try {
          // Update repositories.user_id
          await db
            .update(repositories)
            .set({ userId: userId })
            .where(eq(repositories.userId, existingUserRecord.id));
          
          // Update analysis_reports.user_id
          await db
            .update(analysisReports)
            .set({ userId: userId })
            .where(eq(analysisReports.userId, existingUserRecord.id));
          
          // Update users.id
          await db
            .update(users)
            .set({ id: userId })
            .where(eq(users.clerkId, userId));
          
          console.log('Successfully migrated user.id from UUID to Clerk userId');
        } catch (migrationError: unknown) {
          const error = migrationError as { message?: string; code?: string; detail?: string };
          console.error('Migration failed, continuing with update:', {
            error: error?.message,
            code: error?.code,
          });
          logger.error('Failed to migrate user.id from UUID to Clerk userId', {
            error: error?.message,
            code: error?.code,
            oldId: existingUserRecord.id,
            newId: userId,
          });
        }
      }
    }

    // Upsert user - create or update
    console.log('Upserting user:', {
      userId,
      email: userEmail,
      hasGitHubToken: !!encryptedGitHubToken,
    });

    try {
      // Try insert first
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId, // Use Clerk userId directly as id
          clerkId: userId,
          email: userEmail,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          githubUsername: githubUsername,
          githubToken: encryptedGitHubToken,
        })
        .returning();

      console.log('User created successfully:', {
        id: newUser.id,
        clerkId: newUser.clerkId,
        email: newUser.email,
      });

      logger.info('User created successfully', { 
        userId: newUser.id, 
        clerkId: newUser.clerkId,
        email: newUser.email 
      });

      return NextResponse.json({ success: true, user: newUser });
    } catch (insertError: unknown) {
      const error = insertError as { message?: string; code?: string; detail?: string; constraint?: string };
      
      // If user already exists (unique constraint violation), update instead
      if (error?.code === '23505' || error?.constraint?.includes('clerk_id') || error?.message?.includes('unique')) {
        console.log('User already exists, updating instead');
        
        const updateData: {
          email: string;
          firstName: string | null;
          lastName: string | null;
          githubUsername: string | null;
          githubToken?: string | null;
          updatedAt: Date;
        } = {
          email: userEmail,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          githubUsername: githubUsername,
          updatedAt: new Date(),
        };

        // Only update token if we got a new one from Clerk
        if (encryptedGitHubToken) {
          updateData.githubToken = encryptedGitHubToken;
        }

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.clerkId, userId))
          .returning();

        console.log('User updated successfully:', {
          id: updatedUser.id,
          clerkId: updatedUser.clerkId,
          email: updatedUser.email,
        });

        return NextResponse.json({ 
          success: true, 
          user: updatedUser 
        });
      }
      
      // Re-throw if it's a different error
      logger.error('Failed to upsert user in database', {
        error: error?.message,
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
        userId,
        email: userEmail,
      });
      
      throw insertError;
    }
  } catch (error) {
    logger.error('Error syncing user', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
