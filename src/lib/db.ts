import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let databaseInstance: ReturnType<typeof drizzle> | null = null;

try {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    databaseInstance = drizzle(sql, { schema });
  } else if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  DATABASE_URL not set. Database features will be unavailable.');
  }
} catch (error) {
  console.warn('Database connection failed. Database features will be unavailable:', error);
}

export const db = databaseInstance;
export type DB = typeof databaseInstance;
