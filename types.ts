export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string; // Emoji
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  memberId: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export interface Member {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved';
  telegramId?: string;
}

export interface PendingTransaction {
    id: string;
    description: string;
    amount: number;
    date: string; // YYYY-MM-DD string
    type: 'income' | 'expense';
}


// Fix: Add missing type definitions
export type ProductCategory = 'Cafetería' | 'Refrigerador' | 'Alimentos';

export interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    description: string;
    imageUrl: string;
    category: ProductCategory;
}

export interface CartItem extends Product {
    quantity: number;
}

export type ServiceType = 'Mesa' | 'Para llevar' | 'Coworking';
export type PaymentMethod = 'Efectivo' | 'Tarjeta';

export interface Order {
    id: string;
    date: string; // ISO string
    items: CartItem[];
    total: number;
    clientName?: string;
    serviceType: ServiceType;
    paymentMethod: PaymentMethod;
}

export type ExpenseCategory = 'Luz' | 'Internet' | 'Sueldos' | 'Inventario' | 'Otro';
export type ExpenseType = 'Frecuente' | 'Emergente';

export interface Expense {
    id: string;
    date: string; // ISO string
    description: string;
    amount: number;
    category: ExpenseCategory;
    type: ExpenseType;
}

export interface CashSession {
    id: string;
    startDate: string; // ISO string
    endDate?: string; // ISO string
    startAmount: number;
    endAmount?: number;
    status: 'open' | 'closed';
}

export interface CoworkingSession {
    id: string;
    clientName: string;
    startTime: string; // ISO string
    endTime?: string; // ISO string
    status: 'active' | 'finished';
    consumedExtras: CartItem[];
    total: number;
}