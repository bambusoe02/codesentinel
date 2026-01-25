import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export async function GET() {
    try {
        if (!db) {
            return NextResponse.json({
                error: 'Database not initialized',
                env: {
                    hasDbUrl: !!process.env.DATABASE_URL,
                    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20)
                }
            }, { status: 500 });
        }

        // Try to query users
        const allUsers = await db.select().from(users).limit(10);

        return NextResponse.json({
            success: true,
            userCount: allUsers.length,
            users: allUsers.map(u => ({ id: u.id, clerkId: u.clerkId, email: u.email }))
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Database query failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
