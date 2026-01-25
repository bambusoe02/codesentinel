import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { logger } from './logger';

let databaseInstance: ReturnType<typeof drizzle> | null = null;

try {
  // ✅ Use NEON_DB_URL first, fallback to DATABASE_URL
  const dbUrl = process.env.NEON_DB_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    const sql = neon(dbUrl);
    databaseInstance = drizzle(sql, { schema });
  } else if (process.env.NODE_ENV === 'development') {
    logger.warn('DATABASE_URL not set. Database features will be unavailable');
  }
} catch (error) {
  logger.error('Database connection failed', error);
}

export const db = databaseInstance;
export type DB = typeof databaseInstance;
