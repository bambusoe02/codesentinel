import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasNeonDbUrl: !!process.env.NEON_DB_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        neonPrefix: process.env.NEON_DB_URL?.substring(0, 30),
                             dbPrefix: process.env.DATABASE_URL?.substring(0, 30),
    });
}
