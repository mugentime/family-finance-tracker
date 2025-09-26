import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import type { Transaction, TransactionCategory, Budget, Member, Product, CartItem, Order, Expense, CashSession, CoworkingSession, ServiceType, PaymentMethod } from '../types';

// API Configuration
const API_BASE = '/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

interface ApiContextType {
  // Auth
  members: Member[];
  currentUser: Member | null;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  register: (memberDetails: Omit<Member, 'id' | 'role' | 'status'>) => Promise<void>;
  approveMember: (memberId: string) => void;
  deleteMember: (memberId: string) => void;
  updateCurrentUser: (updates: Partial<Omit<Member, 'id' | 'password'>>) => void;

  // Categories
  categories: TransactionCategory[];
  addCategory: (category: Omit<TransactionCategory, 'id'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'memberId'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;

  // Budgets
  budgets: Budget[];
  setBudget: (categoryId: string, amount: number) => void;

  // Products (mock - not API connected)
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  importProducts: (products: Omit<Product, 'id'>[]) => void;

  // Cart & Sales (mock - not API connected)
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;

  // Orders (mock - not API connected)
  orders: Order[];
  createOrder: (orderDetails: { clientName?: string; serviceType: ServiceType; paymentMethod: PaymentMethod }) => void;

  // Expenses (mock - not API connected)
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;

  // Cash Sessions (mock - not API connected)
  cashSessions: CashSession[];
  startCashSession: (startAmount: number) => void;
  closeCashSession: (endAmount: number) => void;

  // Coworking (mock - not API connected)
  coworkingSessions: CoworkingSession[];
  startCoworkingSession: (clientName: string) => void;
  updateCoworkingSession: (sessionId: string, updates: Partial<CoworkingSession>) => void;
  finishCoworkingSession: (sessionId: string, paymentMethod: PaymentMethod) => void;

  // Loading states
  loading: boolean;
  error: string | null;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock localStorage state for non-API features
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [coworkingSessions, setCoworkingSessions] = useState<CoworkingSession[]>([]);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel
        const [membersData, categoriesData, transactionsData] = await Promise.all([
          apiCall('/members'),
          apiCall('/categories'),
          apiCall('/transactions'),
        ]);

        setMembers(membersData);
        setCategories(categoriesData);
        setTransactions(transactionsData);

        // Auto-login admin user for demo
        const adminUser = membersData.find((m: Member) => m.role === 'admin');
        if (adminUser) {
          setCurrentUser(adminUser);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Auth Functions
  const login = async (username: string, password?: string): Promise<void> => {
    const user = members.find(m => m.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }
    if (user.status !== 'active') {
      throw new Error('Cuenta no activa');
    }
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = async (memberDetails: Omit<Member, 'id' | 'role' | 'status'>): Promise<void> => {
    const newMember = await apiCall('/members', {
      method: 'POST',
      body: JSON.stringify({
        ...memberDetails,
        role: 'member',
      }),
    });
    setMembers(prev => [...prev, newMember]);
  };

  // Category Functions
  const addCategory = async (category: Omit<TransactionCategory, 'id'>): Promise<void> => {
    const newCategory = await apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    setCategories(prev => [...prev, newCategory]);
  };

  const deleteCategory = async (categoryId: string): Promise<void> => {
    // Check if category is in use
    const isInUse = transactions.some(t => t.category_id?.toString() === categoryId.toString());
    if (isInUse) {
      throw new Error('No se puede eliminar la categoría porque está siendo utilizada');
    }

    await apiCall(`/categories/${categoryId}`, { method: 'DELETE' });
    setCategories(prev => prev.filter(c => c.id.toString() !== categoryId.toString()));
  };

  // Transaction Functions
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'memberId'>): Promise<void> => {
    if (!currentUser) throw new Error('Usuario no autenticado');

    const newTransaction = await apiCall('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...transaction,
        memberId: currentUser.id,
        categoryId: transaction.categoryId,
        date: transaction.date,
      }),
    });

    // Reload transactions to get updated data with joins
    const updatedTransactions = await apiCall('/transactions');
    setTransactions(updatedTransactions);
  };

  const updateTransaction = async (transaction: Transaction): Promise<void> => {
    await apiCall(`/transactions/${transaction.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.categoryId,
        date: transaction.date,
      }),
    });

    // Reload transactions to get updated data
    const updatedTransactions = await apiCall('/transactions');
    setTransactions(updatedTransactions);
  };

  const deleteTransaction = async (transactionId: string): Promise<void> => {
    await apiCall(`/transactions/${transactionId}`, { method: 'DELETE' });
    setTransactions(prev => prev.filter(t => t.id.toString() !== transactionId.toString()));
  };

  // Mock functions for features not yet connected to API
  const approveMember = (memberId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }
    setMembers(prev => prev.map(u => u.id === memberId ? { ...u, status: 'approved' } : u));
  };

  const deleteMember = (memberId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }
    setMembers(prev => prev.filter(u => u.id !== memberId));
  };

  const updateCurrentUser = (updates: Partial<Omit<Member, 'id' | 'password'>>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
    }
  };

  const setBudget = (categoryId: string, amount: number) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.categoryId === categoryId);
      if (existingIndex > -1) {
        if (amount > 0) {
          const newBudgets = [...prev];
          newBudgets[existingIndex] = { categoryId, amount };
          return newBudgets;
        } else {
          return prev.filter((_, i) => i !== existingIndex);
        }
      } else if (amount > 0) {
        return [...prev, { categoryId, amount }];
      }
      return prev;
    });
  };

  // Mock Product functions
  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: `prod-${Date.now()}` }]);
  };
  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };
  const importProducts = (productsToImport: Omit<Product, 'id'>[]) => {
    setProducts(prev => [...prev, ...productsToImport.map(p => ({ ...p, id: `prod-${Date.now()}-${Math.random()}` }))]);
  };

  // Mock Cart functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    }
  };
  const clearCart = () => setCart([]);

  // Mock Order functions
  const createOrder = (orderDetails: { clientName?: string; serviceType: ServiceType; paymentMethod: PaymentMethod }) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart,
      total: cartTotal,
      ...orderDetails
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
  };

  // Mock Expense functions
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [{ ...expense, id: `exp-${Date.now()}` }, ...prev]);
  };
  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };
  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Mock Cash Session functions
  const startCashSession = (startAmount: number) => {
    const newSession: CashSession = {
      id: `cash-${Date.now()}`,
      startDate: new Date().toISOString(),
      startAmount,
      status: 'open',
    };
    setCashSessions(prev => [...prev, newSession]);
  };
  const closeCashSession = (endAmount: number) => {
    setCashSessions(prev => prev.map(s => s.status === 'open' ? { ...s, status: 'closed', endDate: new Date().toISOString(), endAmount } : s));
  };

  // Mock Coworking functions
  const startCoworkingSession = (clientName: string) => {
    const newSession: CoworkingSession = {
      id: `cowork-${Date.now()}`,
      clientName,
      startTime: new Date().toISOString(),
      status: 'active',
      consumedExtras: [],
      total: 0
    };
    setCoworkingSessions(prev => [...prev, newSession]);
  };
  const updateCoworkingSession = (sessionId: string, updates: Partial<CoworkingSession>) => {
    setCoworkingSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  };
  const finishCoworkingSession = (sessionId: string, paymentMethod: PaymentMethod) => {
    // Mock implementation
    setCoworkingSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'finished', endTime: new Date().toISOString() } : s));
  };

  const value: ApiContextType = {
    members,
    currentUser,
    login,
    logout,
    register,
    approveMember,
    deleteMember,
    updateCurrentUser,
    categories,
    addCategory,
    deleteCategory,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    budgets,
    setBudget,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    orders,
    createOrder,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    cashSessions,
    startCashSession,
    closeCashSession,
    coworkingSessions,
    startCoworkingSession,
    updateCoworkingSession,
    finishCoworkingSession,
    loading,
    error,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApiContext = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApiContext must be used within an ApiContextProvider');
  }
  return context;
};