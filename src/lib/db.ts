import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { logger } from './logger';

let databaseInstance: ReturnType<typeof drizzle> | null = null;

try {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    databaseInstance = drizzle(sql, { schema });
  } else if (process.env.NODE_ENV === 'development') {
    logger.warn('DATABASE_URL not set. Database features will be unavailable');
  }
} catch (error) {
  logger.error('Database connection failed', error);
}

export const db = databaseInstance;
export type DB = typeof databaseInstance;
