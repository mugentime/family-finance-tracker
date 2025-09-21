import React, { useState, useEffect } from 'react';
import type { Transaction, TransactionCategory } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'memberId'> | Transaction) => void;
  transactionToEdit?: Transaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const { categories } = useAppContext();
  
  const getInitialState = () => ({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    categoryId: categories.find(c => c.type === 'expense')?.id || ''
  });

  const [transaction, setTransaction] = useState(getInitialState());
  const [filteredCategories, setFilteredCategories] = useState<TransactionCategory[]>([]);

  useEffect(() => {
    if (isOpen) {
        if (transactionToEdit) {
            setTransaction({ ...transactionToEdit, date: transactionToEdit.date.split('T')[0] });
        } else {
            setTransaction(getInitialState());
        }
    }
  }, [transactionToEdit, isOpen]);
  
  useEffect(() => {
      const cats = categories.filter(c => c.type === transaction.type);
      setFilteredCategories(cats);
      if (!cats.some(c => c.id === transaction.categoryId)) {
        setTransaction(prev => ({...prev, categoryId: cats[0]?.id || ''}))
      }
  }, [transaction.type, categories, transaction.categoryId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransaction(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transaction.amount <= 0) {
        alert("El monto debe ser mayor a cero.");
        return;
    }
    if (!transaction.categoryId) {
        alert("Por favor, seleccione una categoría.");
        return;
    }
    onSave({
        ...transaction,
        date: new Date(transaction.date).toISOString()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{transactionToEdit ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de Transacción</label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setTransaction(t => ({...t, type: 'expense'}))} className={`w-full py-2 rounded-xl font-semibold ${transaction.type === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100'}`}>Gasto</button>
                    <button type="button" onClick={() => setTransaction(t => ({...t, type: 'income'}))} className={`w-full py-2 rounded-xl font-semibold ${transaction.type === 'income' ? 'bg-green-500 text-white' : 'bg-slate-100'}`}>Ingreso</button>
                </div>
              </div>

               <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
                <input type="text" name="description" id="description" value={transaction.description} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" required />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">Monto</label>
                  <input type="number" name="amount" id="amount" value={transaction.amount} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" required />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">Fecha</label>
                  <input type="date" name="date" id="date" value={transaction.date} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" required />
                </div>
              </div>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-slate-600 mb-1">Categoría</label>
                <select name="categoryId" id="categoryId" value={transaction.categoryId} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" required>
                    <option value="" disabled>Seleccione una categoría</option>
                    {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
            </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 rounded-b-3xl">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-slate-800 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-slate-900">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
