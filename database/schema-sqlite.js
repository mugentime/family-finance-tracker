import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Members table for SQLite
export const members = sqliteTable('members', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull().default('member'),
    status: text('status').notNull().default('pending'),
    telegramId: text('telegram_id'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Transaction Categories table for SQLite
export const transactionCategories = sqliteTable('transaction_categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'income' | 'expense'
    icon: text('icon').notNull(),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Transactions table for SQLite
export const transactions = sqliteTable('transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    description: text('description').notNull(),
    amount: real('amount').notNull(),
    type: text('type').notNull(), // 'income' | 'expense'
    categoryId: integer('category_id').notNull().references(() => transactionCategories.id),
    memberId: integer('member_id').notNull().references(() => members.id),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Budgets table for SQLite
export const budgets = sqliteTable('budgets', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id').notNull().references(() => transactionCategories.id),
    amount: real('amount').notNull(),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});