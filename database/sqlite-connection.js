import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema-sqlite.js';

// Create SQLite database for local development
const sqliteDb = new Database('local-database.db');

// Initialize Drizzle with SQLite
export const db = drizzle(sqliteDb, { schema });

// Connection test function
export const testConnection = async () => {
    try {
        // Test with a simple query
        const result = sqliteDb.prepare('SELECT 1 as test').get();
        return result.test === 1;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('SQLite connection failed:', error);
        }
        return false;
    }
};

// Initialize database schema
export const initializeDatabase = async () => {
    try {
        // Create tables if they don't exist
        console.log('Initializing SQLite database...');

        // Create members table
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'member',
                status TEXT NOT NULL DEFAULT 'pending',
                telegram_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create transaction_categories table
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS transaction_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                icon TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create transactions table
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATETIME NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                type TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                member_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES transaction_categories(id),
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Insert default data
        const categoriesCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM transaction_categories').get();
        if (categoriesCount.count === 0) {
            const insertCategory = sqliteDb.prepare(`
                INSERT INTO transaction_categories (name, type, icon) VALUES (?, ?, ?)
            `);

            insertCategory.run('Alimentación', 'expense', '🍔');
            insertCategory.run('Transporte', 'expense', '🚗');
            insertCategory.run('Entretenimiento', 'expense', '🎮');
            insertCategory.run('Salario', 'income', '💰');
            insertCategory.run('Ventas', 'income', '🛒');

            console.log('Default categories created');
        }

        // Create default admin user
        const usersCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM members').get();
        if (usersCount.count === 0) {
            const insertUser = sqliteDb.prepare(`
                INSERT INTO members (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)
            `);

            insertUser.run('admin', 'admin@example.com', 'admin123', 'admin', 'active');
            insertUser.run('usuario', 'user@example.com', 'user123', 'member', 'active');

            console.log('Default users created');
        }

        console.log('SQLite database initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize SQLite database:', error);
        return false;
    }
};

// Graceful shutdown
export const closeConnection = async () => {
    try {
        sqliteDb.close();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error closing SQLite connection:', error);
        }
    }
};