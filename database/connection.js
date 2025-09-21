import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
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
export const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Database connection failed:', error);
        }
        return false;
    }
};
// Health check function
export const getDatabaseHealth = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT version(), now()');
        client.release();
        return {
            status: 'healthy',
            version: result.rows[0].version,
            timestamp: result.rows[0].now
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

// Graceful shutdown
export const closeConnection = async () => {
    try {
        await pool.end();
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error closing database connection:', error);
        }
    }
};
