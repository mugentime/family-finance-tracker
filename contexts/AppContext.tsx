import React, { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
// Fix: Import all necessary types
import type { Transaction, TransactionCategory, Budget, Member, Product, CartItem, Order, Expense, CashSession, CoworkingSession, ServiceType, PaymentMethod } from '../types';

const initialCategories: TransactionCategory[] = [
    // Expenses
    { id: 'cat-exp-1', name: 'Alimentos', type: 'expense', icon: '🛒' },
    { id: 'cat-exp-2', name: 'Vivienda', type: 'expense', icon: '🏡' },
    { id: 'cat-exp-3', name: 'Transporte', type: 'expense', icon: '🚗' },
    { id: 'cat-exp-4', name: 'Servicios', type: 'expense', icon: '💡' },
    { id: 'cat-exp-5', name: 'Entretenimiento', type: 'expense', icon: '🎬' },
    { id: 'cat-exp-6', name: 'Salud', type: 'expense', icon: '❤️‍🩹' },
    { id: 'cat-exp-7', name: 'Educación', type: 'expense', icon: '🎓' },
    { id: 'cat-exp-8', name: 'Otro', type: 'expense', icon: '📦' },
    // Incomes
    { id: 'cat-inc-1', name: 'Salario', type: 'income', icon: '💼' },
    { id: 'cat-inc-2', name: 'Bonos', type: 'income', icon: '🎁' },
    { id: 'cat-inc-3', name: 'Inversiones', type: 'income', icon: '📈' },
    { id: 'cat-inc-4', name: 'Otro', type: 'income', icon: '🪙' },
];

const initialAdmin: Member = {
    id: 'admin-001',
    username: 'Admin',
    email: 'admin@familia.com',
    password: 'password123',
    role: 'admin',
    status: 'approved',
};

// Fix: Expand AppContextType to include all state and functions
interface AppContextType {
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
    addCategory: (category: Omit<TransactionCategory, 'id'>) => void;
    deleteCategory: (categoryId: string) => void;
    // Transactions
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id' | 'memberId'>) => void;
    updateTransaction: (transaction: Transaction) => void;
    deleteTransaction: (transactionId: string) => void;
    // Budgets
    budgets: Budget[];
    setBudget: (categoryId: string, amount: number) => void;
    // Products
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    importProducts: (products: Omit<Product, 'id'>[]) => void;
    // Cart & Sales
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    // Orders
    orders: Order[];
    createOrder: (orderDetails: { clientName?: string; serviceType: ServiceType; paymentMethod: PaymentMethod }) => void;
    // Expenses
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (expenseId: string) => void;
    // Cash Sessions
    cashSessions: CashSession[];
    startCashSession: (startAmount: number) => void;
    closeCashSession: (endAmount: number) => void;
    // Coworking
    coworkingSessions: CoworkingSession[];
    startCoworkingSession: (clientName: string) => void;
    updateCoworkingSession: (sessionId: string, updates: Partial<CoworkingSession>) => void;
    finishCoworkingSession: (sessionId: string, paymentMethod: PaymentMethod) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const calculateCoworkingCost = (startTime: string, endTime: string): { cost: number; minutes: number } => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.max(0, Math.ceil(durationMs / (1000 * 60)));

    let cost = 0;
    if (durationMinutes > 0) {
      if (durationMinutes <= 60) {
          cost = 58;
      } else {
          const extraMinutes = durationMinutes - 60;
          const halfHourBlocks = Math.ceil(extraMinutes / 30);
          cost = 58 + (halfHourBlocks * 35);
      }
    }
    return { cost, minutes: durationMinutes };
};

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Auth State
    const [members, setMembers] = useLocalStorage<Member[]>('members', []);
    const [currentUser, setCurrentUser] = useLocalStorage<Member | null>('currentUser', null);


    // Seed initial admin user if not present and auto-login
    useEffect(() => {
        const adminExists = members.some(u => u.role === 'admin' && u.username === 'Admin');
        if (!adminExists) {
            setMembers(prev => [...prev, initialAdmin]);
        }
        if (!currentUser && members.length > 0) {
            const admin = members.find(u => u.role === 'admin' && u.username === 'Admin');
            if(admin) {
                const { password: _, ...userToStore } = admin;
                setCurrentUser(userToStore);
            }
        }
    }, [members, setMembers, currentUser, setCurrentUser]);

    // Data State
    const [categories, setCategories] = useLocalStorage<TransactionCategory[]>('categories', initialCategories);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
    // Fix: Add new states for the application features
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
    const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
    const [cashSessions, setCashSessions] = useLocalStorage<CashSession[]>('cashSessions', []);
    const [coworkingSessions, setCoworkingSessions] = useLocalStorage<CoworkingSession[]>('coworkingSessions', []);

    const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);

    // Auth Functions
    const login = (username: string, password?: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const user = members.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (!user) {
                return reject(new Error('Miembro no encontrado.'));
            }
            if (user.password !== password) {
                return reject(new Error('Contraseña incorrecta.'));
            }
            if (user.status === 'pending') {
                return reject(new Error('Su cuenta está pendiente de aprobación.'));
            }
            const { password: _, ...userToStore } = user;
            setCurrentUser(userToStore);
            resolve();
        });
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const register = (memberDetails: Omit<Member, 'id' | 'role' | 'status'>): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (members.some(u => u.username.toLowerCase() === memberDetails.username.toLowerCase())) {
                return reject(new Error('El nombre de usuario ya existe.'));
            }
            if (members.some(u => u.email.toLowerCase() === memberDetails.email.toLowerCase())) {
                return reject(new Error('El correo electrónico ya está en uso.'));
            }
            const newMember: Member = {
                ...memberDetails,
                id: `member-${Date.now()}`,
                role: 'member',
                status: 'approved', // Bypass approval process for sandbox
            };
            setMembers(prev => [...prev, newMember]);
            resolve();
        });
    };

    const approveMember = (memberId: string) => {
        setMembers(prev => prev.map(u => u.id === memberId ? { ...u, status: 'approved' } : u));
    };

    const deleteMember = (memberId: string) => {
        setMembers(prev => prev.filter(u => u.id !== memberId));
    };
    
    const updateCurrentUser = (updates: Partial<Omit<Member, 'id' | 'password'>>) => {
        if (!currentUser) return;

        const userInMembers = members.find(m => m.id === currentUser.id);
        if (!userInMembers) return;
        
        const fullyUpdatedUser = { ...userInMembers, ...updates };

        setMembers(prevMembers => prevMembers.map(m => m.id === currentUser.id ? fullyUpdatedUser : m));

        const { password, ...userToStore } = fullyUpdatedUser;
        setCurrentUser(userToStore);
    };

    // Category Functions
    const addCategory = (category: Omit<TransactionCategory, 'id'>) => {
        setCategories(prev => [...prev, { ...category, id: `cat-${Date.now()}` }]);
    };

    const deleteCategory = (categoryId: string) => {
        const isCategoryInUse = transactions.some(t => t.categoryId === categoryId);
        if (isCategoryInUse) {
            alert('No se puede eliminar la categoría porque está siendo utilizada en una o más transacciones.');
            return;
        }
        const isBudgetInUse = budgets.some(b => b.categoryId === categoryId);
        if (isBudgetInUse) {
            alert('No se puede eliminar la categoría porque está siendo utilizada en un presupuesto.');
            return;
        }
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    // Transaction Functions
    const addTransaction = (transaction: Omit<Transaction, 'id' | 'memberId'>) => {
        if (!currentUser) return;
        const newTransaction: Transaction = {
            ...transaction,
            id: `trans-${Date.now()}`,
            memberId: currentUser.id,
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };
    
    const updateTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    };

    const deleteTransaction = (transactionId: string) => {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    };

    // Budget Functions
    const setBudget = (categoryId: string, amount: number) => {
        setBudgets(prev => {
            const existingBudgetIndex = prev.findIndex(b => b.categoryId === categoryId);
            const newBudgets = [...prev];
            if (existingBudgetIndex > -1) {
                if (amount > 0) {
                    newBudgets[existingBudgetIndex] = { categoryId, amount };
                } else {
                    newBudgets.splice(existingBudgetIndex, 1);
                }
            } else if (amount > 0) {
                newBudgets.push({ categoryId, amount });
            }
            return newBudgets;
        });
    };

    // Fix: Implement all missing functions
    // Product Functions
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
        setProducts(prev => {
            const updatedProducts = [...prev];
            productsToImport.forEach(p => {
                const existingIndex = updatedProducts.findIndex(ep => ep.name.toLowerCase() === p.name.toLowerCase());
                if (existingIndex > -1) {
                    updatedProducts[existingIndex] = { ...updatedProducts[existingIndex], ...p };
                } else {
                    const newProduct: Product = { ...p, id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
                    updatedProducts.push(newProduct);
                }
            });
            return updatedProducts;
        });
    };

    // Cart Functions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) {
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
            return;
        }
        setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    };
    const clearCart = () => setCart([]);

    // Order Functions
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

    // Expense Functions
    const addExpense = (expense: Omit<Expense, 'id'>) => {
        setExpenses(prev => [{ ...expense, id: `exp-${Date.now()}` }, ...prev]);
    };
    const updateExpense = (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    };
    const deleteExpense = (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };

    // Cash Session Functions
    const startCashSession = (startAmount: number) => {
        if (cashSessions.some(s => s.status === 'open')) {
            alert("Ya hay una sesión de caja activa.");
            return;
        }
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
    
    // Coworking Functions
    const startCoworkingSession = (clientName: string) => {
        const newSession: CoworkingSession = {
            id: `cowork-${Date.now()}`,
            clientName: clientName || `Cliente ${coworkingSessions.length + 1}`,
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
        const session = coworkingSessions.find(s => s.id === sessionId && s.status === 'active');
        if (!session) return;

        const endTime = new Date().toISOString();
        const { cost: coworkingCost } = calculateCoworkingCost(session.startTime, endTime);
        const extrasCost = session.consumedExtras.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const total = coworkingCost + extrasCost;

        const coworkingProduct: CartItem = { 
            id: `cowork-${session.id}`, name: `Coworking: ${session.clientName}`, price: coworkingCost, quantity: 1, 
            cost: 0, stock: 0, description: `Servicio de coworking para ${session.clientName}`, imageUrl: '', category: 'Cafetería' 
        };
        const orderItems = [...session.consumedExtras, coworkingProduct];

        const newOrder: Order = {
            id: `order-cowork-${Date.now()}`, date: endTime, items: orderItems, total,
            clientName: session.clientName, serviceType: 'Coworking', paymentMethod,
        };
        setOrders(prev => [newOrder, ...prev]);
        setCoworkingSessions(prev => prev.map(s => s.id === sessionId ? { ...s, endTime, status: 'finished', total } : s));
    };

    return (
        <AppContext.Provider value={{
            members, currentUser, login, logout, register, approveMember, deleteMember, updateCurrentUser,
            categories, addCategory, deleteCategory,
            transactions, addTransaction, updateTransaction, deleteTransaction,
            budgets, setBudget,
            products, addProduct, updateProduct, deleteProduct, importProducts,
            cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal,
            orders, createOrder,
            expenses, addExpense, updateExpense, deleteExpense,
            cashSessions, startCashSession, closeCashSession,
            coworkingSessions, startCoworkingSession, updateCoworkingSession, finishCoworkingSession
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};