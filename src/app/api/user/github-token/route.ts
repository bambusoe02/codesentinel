import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';
import { encrypt, isEncryptionConfigured } from '@/lib/encryption';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { githubToken } = body;

    if (!githubToken || typeof githubToken !== 'string') {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 400 }
      );
    }

    // Check if encryption is configured
    if (!isEncryptionConfigured()) {
      return NextResponse.json(
        { error: 'Encryption key not configured. Please set ENCRYPTION_KEY environment variable.' },
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

    // Encrypt token before storing
    let encryptedToken: string;
    try {
      encryptedToken = encrypt(githubToken);
    } catch (error) {
      console.error('Error encrypting token:', error);
      return NextResponse.json(
        { error: 'Failed to encrypt token' },
        { status: 500 }
      );
    }

    // Update user's GitHub token (encrypted)
    const [updatedUser] = await db
      .update(users)
      .set({
        githubToken: encryptedToken,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning();

    // Don't return the token in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { githubToken: _unusedToken, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      message: 'GitHub token saved successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Error saving GitHub token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return whether token exists (but not the token itself)
    return NextResponse.json({
      hasToken: !!user.githubToken,
      githubUsername: user.githubUsername,
    });
  } catch (error) {
    console.error('Error fetching GitHub token status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

