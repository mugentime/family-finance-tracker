import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import StatCard from '../components/StatCard';
import { DashboardIcon, ExpenseIcon, BudgetIcon } from '../components/Icons';

const toISODateString = (date: Date) => date.toISOString().split('T')[0];

const ReportsScreen: React.FC = () => {
    const { transactions, members, categories } = useAppContext();
    
    const today = new Date();
    const startOfMonth = toISODateString(new Date(today.getFullYear(), today.getMonth(), 1));
    const endOfToday = toISODateString(today);

    const [startDate, setStartDate] = useState(startOfMonth);
    const [endDate, setEndDate] = useState(endOfToday);

    const {
        totalIncome,
        totalExpenses,
        netSavings
    } = useMemo(() => {
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });

        const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netSavings = totalIncome - totalExpenses;

        return { totalIncome, totalExpenses, netSavings };
    }, [startDate, endDate, transactions]);
    
    const handleDownload = () => {
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);
        const data = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return tDate >= start && tDate <= end;
            })
            .map(t => ({
                id: t.id,
                date: new Date(t.date).toLocaleDateString(),
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: categories.find(c => c.id === t.categoryId)?.name || 'N/A',
                member: members.find(m => m.id === t.memberId)?.username || 'N/A'
            }));

        if (data.length === 0) {
            alert("No hay datos para exportar en el periodo seleccionado.");
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))].join('\n');
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `transacciones_${startDate}_a_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Reportes</h1>

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatCard title="Ingresos Totales" value={`$${totalIncome.toFixed(2)}`} icon={<DashboardIcon className="h-6 w-6 text-green-600" />} />
                <StatCard title="Gastos Totales" value={`$${totalExpenses.toFixed(2)}`} icon={<ExpenseIcon className="h-6 w-6 text-red-600" />} />
                <StatCard title="Ahorro Neto" value={`$${netSavings.toFixed(2)}`} icon={<BudgetIcon className="h-6 w-6 text-indigo-600" />} />
            </div>
            
            <div className="bg-white p-4 rounded-3xl shadow-md">
                 <h2 className="text-lg font-bold text-slate-800 mb-3">Exportar Datos</h2>
                <button onClick={handleDownload} className="px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors">Descargar Transacciones (CSV)</button>
            </div>
        </div>
    );
};

export default ReportsScreen;
