import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import type { Transaction, TransactionCategory, Budget, Member } from '../types';

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

  // Categories
  categories: TransactionCategory[];
  addCategory: (category: Omit<TransactionCategory, 'id'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'memberId'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const value: ApiContextType = {
    members,
    currentUser,
    login,
    logout,
    register,
    categories,
    addCategory,
    deleteCategory,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
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