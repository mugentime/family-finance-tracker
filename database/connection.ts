import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle with the pool
export const db = drizzle(pool, { schema });

// Export pool for direct queries if needed
export { pool };

// Connection test function
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Database connection failed:', error);
    }
    return false;
  }
};

// Graceful shutdown
export const closeConnection = async (): Promise<void> => {
  try {
    await pool.end();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error closing database connection:', error);
    }
  }
};