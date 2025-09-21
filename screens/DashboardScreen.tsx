import React, { useMemo } from 'react';
import StatCard from '../components/StatCard';
import { useAppContext } from '../contexts/AppContext';
import { DashboardIcon, ExpenseIcon, BudgetIcon } from '../components/Icons';

const DashboardScreen: React.FC = () => {
    const { transactions, categories } = useAppContext();

    const thisMonthStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startOfMonth && tDate <= endOfMonth;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const savings = income - expenses;
        
        const expenseByCategory = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = categories.find(c => c.id === t.categoryId);
                if (category) {
                    acc[category.name] = (acc[category.name] || 0) + t.amount;
                }
                return acc;
            }, {} as Record<string, number>);

        const topSpendingCategories = Object.entries(expenseByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));

        return { income, expenses, savings, topSpendingCategories };
    }, [transactions, categories]);


    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-600">Resumen financiero de este mes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Ingresos del Mes" 
                    value={`$${thisMonthStats.income.toFixed(2)}`}
                    icon={<DashboardIcon className="h-6 w-6 text-green-600" />}
                />
                <StatCard 
                    title="Gastos del Mes" 
                    value={`$${thisMonthStats.expenses.toFixed(2)}`}
                    icon={<ExpenseIcon className="h-6 w-6 text-red-600" />}
                />
                <StatCard 
                    title="Balance del Mes" 
                    value={`$${thisMonthStats.savings.toFixed(2)}`}
                    icon={<BudgetIcon className="h-6 w-6 text-sky-600" />}
                />
            </div>
            <div className="mt-8 bg-white p-6 rounded-3xl shadow-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Principales Gastos del Mes</h2>
                {thisMonthStats.topSpendingCategories.length > 0 ? (
                    <ul className="space-y-3">
                        {thisMonthStats.topSpendingCategories.map((cat, index) => (
                            <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md even:bg-slate-50">
                                <span className="font-medium text-slate-700">{index + 1}. {cat.name}</span>
                                <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full">${cat.amount.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 py-4">No hay gastos registrados este mes.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardScreen;
