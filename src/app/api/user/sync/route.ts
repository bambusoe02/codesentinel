import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
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

    // Check if user exists in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      // Only update token if we got a new one from Clerk (don't overwrite manual token unless we have a new one)
      const updateData: {
        email: string;
        firstName: string | null;
        lastName: string | null;
        githubUsername: string | null;
        githubToken?: string | null;
        updatedAt: Date;
      } = {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        githubUsername: githubUsername || existingUser[0].githubUsername,
        updatedAt: new Date(),
      };

      // Update token only if we successfully retrieved a new one
      if (encryptedGitHubToken) {
        updateData.githubToken = encryptedGitHubToken;
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.clerkId, userId));

      return NextResponse.json({ 
        success: true, 
        user: { ...existingUser[0], email: clerkUser.emailAddresses[0]?.emailAddress } 
      });
    }

    // Create new user
    // Use Clerk's userId as the id for consistency (TEXT field, not auto-increment)
    const userDbId = userId; // Używaj bezpośrednio Clerk userId (już jest string)
    
    // Walidacja email
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      logger.error('User email is missing', { userId, clerkUser: { id: clerkUser.id } });
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          id: userDbId, // Explicit TEXT id - required, no default
          clerkId: userId,
          email: userEmail,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          githubUsername: githubUsername,
          githubToken: encryptedGitHubToken, // Encrypted token from Clerk
        })
        .returning();

      logger.info('User created successfully', { 
        userId: newUser.id, 
        clerkId: newUser.clerkId,
        email: newUser.email 
      });

      return NextResponse.json({ success: true, user: newUser });
    } catch (insertError: unknown) {
      const error = insertError as { message?: string; code?: string; detail?: string; constraint?: string };
      logger.error('Failed to create user in database', {
        error: error?.message,
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
        userId: userDbId,
        clerkId: userId,
        email: userEmail,
      });
      
      // Re-throw to be caught by outer catch
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
