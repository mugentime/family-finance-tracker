import { eq, desc, and } from 'drizzle-orm';
import { db } from '../database/connection';
import * as schema from '../database/schema';
import type {
  Member,
  TransactionCategory,
  Transaction,
  Budget,
  Product,
  Order,
  Expense,
  CashSession,
  CoworkingSession,
  CartItem
} from '../types';

// Helper function to convert database results to app types
const mapDbMember = (dbMember: any): Member => ({
  id: dbMember.id.toString(),
  username: dbMember.username,
  email: dbMember.email,
  password: dbMember.password,
  role: dbMember.role,
  status: dbMember.status,
  telegramId: dbMember.telegramId,
});

const mapDbCategory = (dbCategory: any): TransactionCategory => ({
  id: dbCategory.id.toString(),
  name: dbCategory.name,
  type: dbCategory.type,
  icon: dbCategory.icon,
});

const mapDbTransaction = (dbTransaction: any): Transaction => ({
  id: dbTransaction.id.toString(),
  date: dbTransaction.date.toISOString(),
  description: dbTransaction.description,
  amount: parseFloat(dbTransaction.amount),
  type: dbTransaction.type,
  categoryId: dbTransaction.categoryId.toString(),
  memberId: dbTransaction.memberId.toString(),
});

const mapDbProduct = (dbProduct: any): Product => ({
  id: dbProduct.id.toString(),
  name: dbProduct.name,
  price: parseFloat(dbProduct.price),
  cost: parseFloat(dbProduct.cost),
  stock: dbProduct.stock,
  description: dbProduct.description || '',
  imageUrl: dbProduct.imageUrl || '',
  category: dbProduct.category,
});

// Members Service
export class MembersService {
  static async getAll(): Promise<Member[]> {
    const results = await db.select().from(schema.members);
    return results.map(mapDbMember);
  }

  static async getById(id: string): Promise<Member | null> {
    const results = await db.select().from(schema.members).where(eq(schema.members.id, parseInt(id)));
    return results.length > 0 ? mapDbMember(results[0]) : null;
  }

  static async create(member: Omit<Member, 'id'>): Promise<Member> {
    const [result] = await db.insert(schema.members).values({
      username: member.username,
      email: member.email,
      password: member.password || '',
      role: member.role,
      status: member.status,
      telegramId: member.telegramId,
    }).returning();
    return mapDbMember(result);
  }

  static async update(id: string, updates: Partial<Member>): Promise<Member | null> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.username) updateData.username = updates.username;
    if (updates.email) updateData.email = updates.email;
    if (updates.password) updateData.password = updates.password;
    if (updates.role) updateData.role = updates.role;
    if (updates.status) updateData.status = updates.status;
    if (updates.telegramId) updateData.telegramId = updates.telegramId;

    const [result] = await db.update(schema.members)
      .set(updateData)
      .where(eq(schema.members.id, parseInt(id)))
      .returning();
    return result ? mapDbMember(result) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.members).where(eq(schema.members.id, parseInt(id)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Categories Service
export class CategoriesService {
  static async getAll(): Promise<TransactionCategory[]> {
    const results = await db.select().from(schema.transactionCategories);
    return results.map(mapDbCategory);
  }

  static async create(category: Omit<TransactionCategory, 'id'>): Promise<TransactionCategory> {
    const [result] = await db.insert(schema.transactionCategories).values({
      name: category.name,
      type: category.type,
      icon: category.icon,
    }).returning();
    return mapDbCategory(result);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.transactionCategories).where(eq(schema.transactionCategories.id, parseInt(id)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Transactions Service
export class TransactionsService {
  static async getAll(): Promise<Transaction[]> {
    const results = await db.select().from(schema.transactions).orderBy(desc(schema.transactions.date));
    return results.map(mapDbTransaction);
  }

  static async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const [result] = await db.insert(schema.transactions).values({
      date: new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      categoryId: parseInt(transaction.categoryId),
      memberId: parseInt(transaction.memberId),
    }).returning();
    return mapDbTransaction(result);
  }

  static async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.date) updateData.date = new Date(updates.date);
    if (updates.description) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount.toString();
    if (updates.type) updateData.type = updates.type;
    if (updates.categoryId) updateData.categoryId = parseInt(updates.categoryId);

    const [result] = await db.update(schema.transactions)
      .set(updateData)
      .where(eq(schema.transactions.id, parseInt(id)))
      .returning();
    return result ? mapDbTransaction(result) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.transactions).where(eq(schema.transactions.id, parseInt(id)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Budgets Service
export class BudgetsService {
  static async getAll(): Promise<Budget[]> {
    const results = await db.select().from(schema.budgets);
    return results.map(result => ({
      categoryId: result.categoryId.toString(),
      amount: parseFloat(result.amount),
    }));
  }

  static async setBudget(categoryId: string, amount: number): Promise<Budget> {
    const existingBudget = await db.select().from(schema.budgets)
      .where(eq(schema.budgets.categoryId, parseInt(categoryId)));

    if (existingBudget.length > 0) {
      const [result] = await db.update(schema.budgets)
        .set({ amount: amount.toString(), updatedAt: new Date() })
        .where(eq(schema.budgets.categoryId, parseInt(categoryId)))
        .returning();
      return { categoryId: result.categoryId.toString(), amount: parseFloat(result.amount) };
    } else {
      const [result] = await db.insert(schema.budgets).values({
        categoryId: parseInt(categoryId),
        amount: amount.toString(),
      }).returning();
      return { categoryId: result.categoryId.toString(), amount: parseFloat(result.amount) };
    }
  }

  static async delete(categoryId: string): Promise<boolean> {
    const result = await db.delete(schema.budgets).where(eq(schema.budgets.categoryId, parseInt(categoryId)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Products Service
export class ProductsService {
  static async getAll(): Promise<Product[]> {
    const results = await db.select().from(schema.products);
    return results.map(mapDbProduct);
  }

  static async create(product: Omit<Product, 'id'>): Promise<Product> {
    const [result] = await db.insert(schema.products).values({
      name: product.name,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category,
    }).returning();
    return mapDbProduct(result);
  }

  static async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.name) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = updates.price.toString();
    if (updates.cost !== undefined) updateData.cost = updates.cost.toString();
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.description) updateData.description = updates.description;
    if (updates.imageUrl) updateData.imageUrl = updates.imageUrl;
    if (updates.category) updateData.category = updates.category;

    const [result] = await db.update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, parseInt(id)))
      .returning();
    return result ? mapDbProduct(result) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.products).where(eq(schema.products.id, parseInt(id)));
    return (result.rowCount ?? 0) > 0;
  }
}

// Orders Service
export class OrdersService {
  static async getAll(): Promise<Order[]> {
    const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.date));
    const orderIds = orders.map(order => order.id);

    if (orderIds.length === 0) return [];

    const orderItems = await db.select().from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderIds[0])); // Simplified for now

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));

        return {
          id: order.id.toString(),
          date: order.date.toISOString(),
          total: parseFloat(order.total),
          clientName: order.clientName || undefined,
          serviceType: order.serviceType as any,
          paymentMethod: order.paymentMethod as any,
          items: items.map(item => ({
            id: item.productId?.toString() || item.id.toString(),
            name: item.productName,
            price: parseFloat(item.price),
            quantity: item.quantity,
            cost: 0,
            stock: 0,
            description: '',
            imageUrl: '',
            category: 'Cafetería' as any,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  static async create(order: Omit<Order, 'id'>, items: CartItem[]): Promise<Order> {
    const [orderResult] = await db.insert(schema.orders).values({
      date: new Date(order.date),
      total: order.total.toString(),
      clientName: order.clientName,
      serviceType: order.serviceType,
      paymentMethod: order.paymentMethod,
    }).returning();

    // Insert order items
    if (items.length > 0) {
      await db.insert(schema.orderItems).values(
        items.map(item => ({
          orderId: orderResult.id,
          productId: parseInt(item.id),
          productName: item.name,
          price: item.price.toString(),
          quantity: item.quantity,
        }))
      );
    }

    // Return the created order with items
    const orderWithItems = {
      id: orderResult.id.toString(),
      date: orderResult.date.toISOString(),
      total: parseFloat(orderResult.total),
      clientName: orderResult.clientName || undefined,
      serviceType: orderResult.serviceType as any,
      paymentMethod: orderResult.paymentMethod as any,
      items,
    };

    return orderWithItems;
  }
}

// Database initialization and seeding
export class DatabaseService {
  static async initializeData(): Promise<void> {
    // Check if data already exists
    const existingCategories = await db.select().from(schema.transactionCategories);
    const existingMembers = await db.select().from(schema.members);

    // Seed initial categories if none exist
    if (existingCategories.length === 0) {
      await db.insert(schema.transactionCategories).values([
        { name: 'Alimentos', type: 'expense', icon: '🛒' },
        { name: 'Vivienda', type: 'expense', icon: '🏡' },
        { name: 'Transporte', type: 'expense', icon: '🚗' },
        { name: 'Servicios', type: 'expense', icon: '💡' },
        { name: 'Entretenimiento', type: 'expense', icon: '🎬' },
        { name: 'Salud', type: 'expense', icon: '❤️‍🩹' },
        { name: 'Educación', type: 'expense', icon: '🎓' },
        { name: 'Otro', type: 'expense', icon: '📦' },
        { name: 'Salario', type: 'income', icon: '💼' },
        { name: 'Bonos', type: 'income', icon: '🎁' },
        { name: 'Inversiones', type: 'income', icon: '📈' },
        { name: 'Otro', type: 'income', icon: '🪙' },
      ]);
    }

    // Seed initial admin user if none exist
    if (existingMembers.length === 0) {
      await db.insert(schema.members).values({
        username: 'Admin',
        email: 'admin@familia.com',
        password: 'password123',
        role: 'admin',
        status: 'approved',
      });
    }
  }
}