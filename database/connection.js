import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Database connection configuration with Railway optimizations
const getPoolConfig = () => {
    const config = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: process.env.NODE_ENV === 'production' ? 5 : 20,
        min: 0,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 15000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 500,
        allowExitOnIdle: true,
    };

    if (!config.connectionString) {
        console.warn('DATABASE_URL not provided. Using fallback configuration.');
        return {
            ...config,
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'family_finance',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        };
    }

    return config;
};

// Create connection pool with error handling
let pool;
let db;
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

const initializeDatabase = async () => {
    try {
        if (pool) {
            return { pool, db };
        }

        pool = new Pool(getPoolConfig());

        // Add pool error handlers
        pool.on('error', (err) => {
            console.error('Unexpected database pool error:', err);
        });

        pool.on('connect', () => {
            if (process.env.NODE_ENV !== 'production') {
                console.log('New database connection established');
            }
        });

        // Initialize Drizzle with the pool
        db = drizzle(pool, { schema });

        return { pool, db };
    } catch (error) {
        console.error('Failed to initialize database pool:', error);
        throw error;
    }
};

// Lazy database initialization - don't initialize at module load
let _pool;
let _db;

export const getPool = async () => {
    if (!_pool) {
        const { pool } = await initializeDatabase();
        _pool = pool;
    }
    return _pool;
};

export const getDb = async () => {
    if (!_db) {
        const { db } = await initializeDatabase();
        _db = db;
    }
    return _db;
};

// Legacy exports for compatibility
export const pool = new Proxy({}, {
    get() {
        throw new Error('Use getPool() instead of direct pool access');
    }
});

export const db = new Proxy({}, {
    get() {
        throw new Error('Use getDb() instead of direct db access');
    }
});

// Enhanced connection test with retry logic and Railway optimizations
export const testConnection = async (retries = 5) => {
    let attempt = 0;

    while (attempt < retries) {
        try {
            connectionAttempts++;
            const pool = await getPool();

            // Test with timeout for Railway deployment
            const client = await Promise.race([
                pool.connect(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), 15000)
                )
            ]);

            await client.query('SELECT 1');
            client.release();

            if (process.env.NODE_ENV !== 'production') {
                console.log('Database connection test successful');
            }
            return true;
        }
        catch (error) {
            attempt++;
            connectionAttempts++;

            console.warn(`Database connection attempt ${attempt}/${retries} failed:`, error.message);

            if (attempt < retries) {
                // Wait before retry with exponential backoff (max 10 seconds)
                const delay = Math.min(Math.pow(2, attempt) * 1000, 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('Database connection failed after', retries, 'attempts');
    return false;
};

// Health check with detailed status - graceful fallback
export const getDatabaseHealth = async () => {
    try {
        const pool = await getPool();
        const client = await pool.connect();
        const result = await client.query('SELECT version(), now()');
        client.release();

        return {
            status: 'healthy',
            version: result.rows[0].version,
            timestamp: result.rows[0].now,
            totalConnections: pool.totalCount,
            idleConnections: pool.idleCount,
            waitingConnections: pool.waitingCount,
            connectionAttempts
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            totalConnections: _pool?.totalCount || 0,
            idleConnections: _pool?.idleCount || 0,
            waitingConnections: _pool?.waitingCount || 0,
            connectionAttempts
        };
    }
};

// Graceful shutdown with enhanced cleanup
export const closeConnection = async () => {
    try {
        if (_pool) {
            console.log('Closing database connections...');
            await _pool.end();
            console.log('Database connections closed successfully');
            _pool = null;
            _db = null;
        }
    }
    catch (error) {
        console.error('Error closing database connection:', error);
    }
};
