import { pgTable, serial, text, integer, decimal, timestamp, varchar } from 'drizzle-orm/pg-core';
// Members table
export const members = pgTable('members', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('member'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    telegramId: varchar('telegram_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Transaction Categories table
export const transactionCategories = pgTable('transaction_categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'income' | 'expense'
    icon: varchar('icon', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Transactions table
export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    date: timestamp('date').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'income' | 'expense'
    categoryId: integer('category_id').references(() => transactionCategories.id).notNull(),
    memberId: integer('member_id').references(() => members.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Budgets table
export const budgets = pgTable('budgets', {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id').references(() => transactionCategories.id).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Products table
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
    stock: integer('stock').notNull().default(0),
    description: text('description'),
    imageUrl: text('image_url'),
    category: varchar('category', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Orders table
export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    date: timestamp('date').notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    clientName: varchar('client_name', { length: 255 }),
    serviceType: varchar('service_type', { length: 50 }).notNull(), // 'Mesa' | 'Para llevar' | 'Coworking'
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // 'Efectivo' | 'Tarjeta'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Order Items table (for cart items in orders)
export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id).notNull(),
    productId: integer('product_id').references(() => products.id),
    productName: varchar('product_name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Expenses table
export const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    date: timestamp('date').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: varchar('category', { length: 255 }).notNull(), // 'Luz' | 'Internet' | 'Sueldos' | 'Inventario' | 'Otro'
    type: varchar('type', { length: 50 }).notNull(), // 'Frecuente' | 'Emergente'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Cash Sessions table
export const cashSessions = pgTable('cash_sessions', {
    id: serial('id').primaryKey(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    startAmount: decimal('start_amount', { precision: 10, scale: 2 }).notNull(),
    endAmount: decimal('end_amount', { precision: 10, scale: 2 }),
    status: varchar('status', { length: 50 }).notNull().default('open'), // 'open' | 'closed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Coworking Sessions table
export const coworkingSessions = pgTable('coworking_sessions', {
    id: serial('id').primaryKey(),
    clientName: varchar('client_name', { length: 255 }).notNull(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    status: varchar('status', { length: 50 }).notNull().default('active'), // 'active' | 'finished'
    total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Coworking Session Items table (for consumed extras)
export const coworkingSessionItems = pgTable('coworking_session_items', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => coworkingSessions.id).notNull(),
    productId: integer('product_id').references(() => products.id),
    productName: varchar('product_name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
