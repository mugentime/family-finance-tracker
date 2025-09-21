import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import StatCard from '../components/StatCard';
import { BudgetIcon, ExpenseIcon, DashboardIcon } from '../components/Icons';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

const toISODateString = (date: Date) => date.toISOString().split('T')[0];

const SummaryScreen: React.FC = () => {
    const { transactions, categories } = useAppContext();
    
    const today = new Date();
    const startOfMonth = toISODateString(new Date(today.getFullYear(), today.getMonth(), 1));
    const endOfToday = toISODateString(today);

    const [startDate, setStartDate] = useState(startOfMonth);
    const [endDate, setEndDate] = useState(endOfToday);

    const filteredData = useMemo(() => {
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);

        const filteredTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });

        const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        const expensesByCategory = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = categories.find(c => c.id === t.categoryId);
                if (category) {
                    acc[category.name] = (acc[category.name] || 0) + t.amount;
                }
                return acc;
            }, {} as Record<string, number>);

        const barChartData = Object.entries(expensesByCategory)
            .map(([label, value]) => ({
                label,
                value,
                icon: categories.find(c => c.name === label)?.icon || '💸'
            }))
            .sort((a, b) => b.value - a.value);

        return {
            totalIncome,
            totalExpenses,
            netSavings: totalIncome - totalExpenses,
            barChartData
        };
    }, [startDate, endDate, transactions, categories]);

    const trendData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d;
        }).reverse();

        const labels = last6Months.map(d => d.toLocaleString('es-ES', { month: 'short' }));
        const incomeData = Array(6).fill(0);
        const expenseData = Array(6).fill(0);

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const monthIndex = last6Months.findIndex(d => d.getFullYear() === tDate.getFullYear() && d.getMonth() === tDate.getMonth());
            if (monthIndex !== -1) {
                if (t.type === 'income') {
                    incomeData[monthIndex] += t.amount;
                } else {
                    expenseData[monthIndex] += t.amount;
                }
            }
        });

        return {
            labels,
            datasets: [
                { label: 'Ingresos', data: incomeData, color: '#16a34a' },
                { label: 'Gastos', data: expenseData, color: '#dc2626' }
            ]
        };
    }, [transactions]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Resumen Financiero</h1>

            <div className="bg-white p-4 rounded-3xl shadow-md mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-grow min-w-[150px]">
                        <label className="text-sm font-medium text-slate-600">Desde</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-xl p-2"/>
                    </div>
                    <div className="flex-grow min-w-[150px]">
                        <label className="text-sm font-medium text-slate-600">Hasta</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-xl p-2"/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Ingresos Totales" value={`$${filteredData.totalIncome.toFixed(2)}`} icon={<DashboardIcon className="h-6 w-6 text-green-600" />} />
                <StatCard title="Gastos Totales" value={`$${filteredData.totalExpenses.toFixed(2)}`} icon={<ExpenseIcon className="h-6 w-6 text-red-600" />} />
                <StatCard title="Ahorro Neto" value={`$${filteredData.netSavings.toFixed(2)}`} icon={<BudgetIcon className="h-6 w-6 text-indigo-600" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Gastos por Categoría</h2>
                    <BarChart data={filteredData.barChartData} />
                </div>
                <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-md">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">Tendencia (Últimos 6 meses)</h2>
                     <LineChart data={trendData} />
                </div>
            </div>
        </div>
    );
};

export default SummaryScreen;
