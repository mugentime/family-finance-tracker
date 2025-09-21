import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import StatCard from '../components/StatCard';
import { BudgetIcon, ExpenseIcon, DashboardIcon } from '../components/Icons';

const BudgetScreen: React.FC = () => {
  const { budgets, setBudget, categories, transactions } = useAppContext();
  
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expensesThisMonth = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= startOfMonth && tDate <= endOfMonth;
    });

    return expensesThisMonth.reduce((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  }, [transactions]);
  
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = Object.values(monthlyExpenses).reduce((sum, amount) => sum + amount, 0);

  const handleBudgetChange = (categoryId: string, amount: string) => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      setBudget(categoryId, numericAmount);
    } else if (amount === '') {
      setBudget(categoryId, 0);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Presupuesto Mensual</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Presupuesto Total" value={`$${totalBudgeted.toFixed(2)}`} icon={<DashboardIcon className="h-6 w-6 text-sky-600" />} />
        <StatCard title="Total Gastado" value={`$${totalSpent.toFixed(2)}`} icon={<ExpenseIcon className="h-6 w-6 text-red-600" />} />
        <StatCard title="Restante" value={`$${(totalBudgeted - totalSpent).toFixed(2)}`} icon={<BudgetIcon className="h-6 w-6 text-green-600" />} />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Presupuestos por Categoría</h2>
        <div className="space-y-6">
          {expenseCategories.map(cat => {
            const budget = budgets.find(b => b.categoryId === cat.id)?.amount || 0;
            const spent = monthlyExpenses[cat.id] || 0;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            const remaining = budget - spent;
            
            let progressBarColor = 'bg-green-500';
            if (percentage > 75) progressBarColor = 'bg-yellow-500';
            if (percentage >= 100) progressBarColor = 'bg-red-500';

            return (
              <div key={cat.id}>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={`budget-${cat.id}`} className="font-medium text-slate-700">{cat.icon} {cat.name}</label>
                  <div className="w-28">
                    <input
                      id={`budget-${cat.id}`}
                      type="number"
                      placeholder="0.00"
                      value={budget > 0 ? budget : ''}
                      onChange={e => handleBudgetChange(cat.id, e.target.value)}
                      className="w-full text-right border border-slate-300 rounded-md shadow-sm py-1 px-2 text-sm"
                    />
                  </div>
                </div>
                {budget > 0 && (
                    <>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 my-1">
                            <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 text-right">
                           {remaining >= 0 ? `$${remaining.toFixed(2)} restante` : `$${Math.abs(remaining).toFixed(2)} de más`}
                        </p>
                    </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetScreen;
