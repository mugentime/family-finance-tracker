import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { PlusIcon, TrashIcon } from '../components/Icons';
import type { TransactionCategory } from '../types';

const CategoryRow: React.FC<{ category: TransactionCategory; onDelete: () => void; }> = ({ category, onDelete }) => {
  return (
    <li className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <div className="flex items-center">
        <span className="text-2xl mr-3">{category.icon}</span>
        <span className="font-medium text-slate-800">{category.name}</span>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 transition-colors"
        aria-label={`Eliminar categoría ${category.name}`}
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </li>
  );
};

const SettingsScreen: React.FC = () => {
  const { categories, addCategory, deleteCategory, currentUser, updateCurrentUser } = useAppContext();
  const [newCategory, setNewCategory] = useState({ name: '', icon: '❓', type: 'expense' as 'income' | 'expense' });
  const [isAdding, setIsAdding] = useState(false);
  const [telegramId, setTelegramId] = useState(currentUser?.telegramId || '');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  useEffect(() => {
    setTelegramId(currentUser?.telegramId || '');
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (type: 'income' | 'expense') => {
    setNewCategory(prev => ({ ...prev, type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim() === '' || newCategory.icon.trim() === '') {
        alert('El nombre y el ícono de la categoría no pueden estar vacíos.');
        return;
    }
    addCategory(newCategory);
    setNewCategory({ name: '', icon: '❓', type: 'expense' });
    setIsAdding(false);
  };
  
  const handleSaveTelegramId = () => {
      const trimmedId = telegramId.trim();
      if (trimmedId === '') {
        updateCurrentUser({ telegramId: '' });
        setConfirmationMessage('✅ Conexión con Telegram eliminada.');
        setTimeout(() => setConfirmationMessage(''), 3000);
        return;
      }
      if (!/^-?\d+$/.test(trimmedId)) {
          alert('Por favor, ingrese un ID de Telegram numérico válido.');
          return;
      }
      updateCurrentUser({ telegramId: trimmedId });
      setConfirmationMessage('✅ ¡ID de Telegram guardado! Ahora puedes importar transacciones.');
      setTimeout(() => setConfirmationMessage(''), 4000);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Ajustes</h1>

      <div className="bg-white p-6 rounded-3xl shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Gestionar Categorías</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center px-3 py-2 bg-zinc-900 text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Añadir
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="p-4 mb-6 bg-slate-50 rounded-2xl space-y-4">
            <h3 className="font-semibold text-slate-700">Nueva Categoría</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
                  required
                  placeholder="Ej: Supermercado"
                />
              </div>
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-slate-600 mb-1">Ícono (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  id="icon"
                  value={newCategory.icon}
                  onChange={handleInputChange}
                  maxLength={2}
                  className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 text-center focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Tipo</label>
               <div className="flex gap-2">
                <button type="button" onClick={() => handleTypeChange('expense')} className={`w-full py-2 rounded-xl font-semibold ${newCategory.type === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-700'}`}>Gasto</button>
                <button type="button" onClick={() => handleTypeChange('income')} className={`w-full py-2 rounded-xl font-semibold ${newCategory.type === 'income' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-700'}`}>Ingreso</button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800">Guardar</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Categorías de Gastos</h3>
            {expenseCategories.length > 0 ? (
              <ul className="space-y-2">
                {expenseCategories.map(cat => (
                  <CategoryRow key={cat.id} category={cat} onDelete={() => deleteCategory(cat.id)} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No hay categorías de gastos.</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Categorías de Ingresos</h3>
            {incomeCategories.length > 0 ? (
              <ul className="space-y-2">
                {incomeCategories.map(cat => (
                  <CategoryRow key={cat.id} category={cat} onDelete={() => deleteCategory(cat.id)} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No hay categorías de ingresos.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-md">
        <h2 className="text-xl font-bold text-slate-800">Integración con Telegram</h2>
        <p className="text-sm text-slate-500 mt-2 mb-4">
          Conecta tu cuenta de Telegram para importar transacciones directamente desde el bot. Para encontrar tu ID de usuario, envía el comando <code className="bg-slate-100 text-xs p-1 rounded-md">/id</code> al bot de Telegram.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
            <input 
                type="text" 
                inputMode="numeric"
                value={telegramId}
                onChange={e => setTelegramId(e.target.value)}
                placeholder="Tu ID de Telegram"
                className="flex-grow mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            />
            <button 
                onClick={handleSaveTelegramId}
                className="px-5 py-2 bg-zinc-900 text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors"
            >
                Guardar
            </button>
        </div>
        {confirmationMessage && (
            <p className="text-sm text-green-700 mt-3 bg-green-50 p-3 rounded-lg">{confirmationMessage}</p>
        )}
      </div>
    </div>
  );
};

export default SettingsScreen;