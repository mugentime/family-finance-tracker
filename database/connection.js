// Database connection with fallback support
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
const usePostgres = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && process.env.NODE_ENV === 'production';

let db, testConnection, closeConnection, initializeDatabase;

if (usePostgres) {
    // PostgreSQL for production
    console.log('Using PostgreSQL database');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');
    const schema = await import('./schema.js');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    db = drizzle(pool, { schema });

    testConnection = async () => {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        } catch (error) {
            console.error('PostgreSQL connection failed:', error);
            return false;
        }
    };

    closeConnection = async () => {
        try {
            await pool.end();
        } catch (error) {
            console.error('Error closing PostgreSQL connection:', error);
        }
    };

    initializeDatabase = async () => {
        console.log('PostgreSQL database should be initialized via migrations');
        return true;
    };

} else {
    // SQLite for development
    console.log('Using SQLite database for development');
    const sqliteConnection = await import('./sqlite-connection.js');

    db = sqliteConnection.db;
    testConnection = sqliteConnection.testConnection;
    closeConnection = sqliteConnection.closeConnection;
    initializeDatabase = sqliteConnection.initializeDatabase;
}

export { db, testConnection, closeConnection, initializeDatabase };
