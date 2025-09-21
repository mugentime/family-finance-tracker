import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import TransactionModal from '../components/TransactionModal';
import { PlusIcon, EditIcon, TrashIcon, TelegramIcon } from '../components/Icons';
import type { Transaction, PendingTransaction } from '../types';

const PendingTelegramTransactions: React.FC<{
    telegramId: string;
    onApprove: (tx: PendingTransaction) => void;
    onDiscard: (txId: string) => Promise<void>;
    refreshKey: number;
}> = ({ telegramId, onApprove, onDiscard, refreshKey }) => {
    const [pending, setPending] = useState<PendingTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPending = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pending-transactions/${telegramId}`);
            if (!res.ok) throw new Error("No se pudo conectar al servidor para buscar transacciones.");
            const data = await res.json();
            setPending(data);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    }, [telegramId]);
    
    useEffect(() => {
        fetchPending();
    }, [fetchPending, refreshKey]);

    const handleDiscard = async (txId: string) => {
        await onDiscard(txId);
        setPending(prev => prev.filter(t => t.id !== txId));
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <TelegramIcon className="h-6 w-6 mr-2 text-sky-500" />
                    Bandeja de Entrada de Telegram
                </h2>
                <button onClick={fetchPending} className="text-sm text-zinc-600 hover:underline" disabled={isLoading}>
                    {isLoading ? '...' : 'Refrescar'}
                </button>
            </div>
            
            {isLoading && (
                <p className="text-center text-slate-500 py-4">Buscando transacciones...</p>
            )}

            {!isLoading && error && (
                 <div className="text-center text-red-600 bg-red-50 p-3 rounded-lg">
                    <p className="font-semibold">Error de Conexión</p>
                    <p className="text-sm">{error}</p>
                 </div>
            )}
            
            {!isLoading && !error && pending.length === 0 && (
                <div className="text-center text-slate-500 py-4">
                    <p className="font-semibold">Conexión activa.</p>
                    <p>¡Envía una foto de un recibo a tu bot para que aparezca aquí!</p>
                </div>
            )}

            {!isLoading && !error && pending.length > 0 && (
                <ul className="space-y-3">
                    {pending.map(t => (
                        <li key={t.id} className="p-3 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-grow">
                                <p className="font-medium text-slate-800">{t.description}</p>
                                <p className="text-sm text-slate-500">
                                    {new Date(t.date + 'T00:00:00').toLocaleDateString()} - 
                                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>${t.amount.toFixed(2)}</span>
                                </p>
                            </div>
                            <div className="flex gap-2 self-end sm:self-center">
                                <button onClick={() => handleDiscard(t.id)} className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">Descartar</button>
                                <button onClick={() => onApprove(t)} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Aprobar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const TransactionsScreen: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, categories, members, currentUser } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [pendingTxToApprove, setPendingTxToApprove] = useState<PendingTransaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openModal = (transaction: Transaction | null = null) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setTransactionToEdit(null);
    setIsModalOpen(false);
    setPendingTxToApprove(null); // Always reset this
  };

  const handleApproveFromTelegram = (tx: PendingTransaction) => {
      setPendingTxToApprove(tx);
      const defaultCategory = categories.find(c => c.type === tx.type);
      openModal({
          id: `temp-${tx.id}`, // temp id to identify it's a telegram approval
          description: tx.description,
          amount: tx.amount,
          date: new Date(tx.date + 'T00:00:00').toISOString(),
          type: tx.type,
          categoryId: defaultCategory?.id || '',
          memberId: currentUser!.id
      });
  };

  const handleDiscardFromTelegram = async (transactionId: string) => {
      if (!currentUser?.telegramId) return;
      try {
        await fetch('/api/confirm-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: currentUser.telegramId, transactionId }),
        });
      } catch (error) {
          console.error("Error discarding transaction:", error);
          alert("No se pudo descartar la transacción en el servidor.");
      }
  };

  const handleSave = (transactionData: Omit<Transaction, 'id' | 'memberId'> | Transaction) => {
    const isTelegramApproval = pendingTxToApprove && 'id' in transactionData && transactionData.id.startsWith('temp-');

    if (isTelegramApproval) {
        const { id, memberId, ...newTxData } = transactionData as Transaction;
        addTransaction(newTxData);
        handleDiscardFromTelegram(pendingTxToApprove!.id).then(() => {
            setRefreshKey(k => k + 1); // Trigger a refresh of pending transactions
        });
    } else if ('id' in transactionData) {
        updateTransaction(transactionData as Transaction);
    } else {
        addTransaction(transactionData);
    }
  };
  
  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getMember = (id: string) => members.find(m => m.id === id);

  return (
    <div>
        {currentUser?.telegramId && (
            <PendingTelegramTransactions 
                telegramId={currentUser.telegramId}
                onApprove={handleApproveFromTelegram}
                onDiscard={handleDiscardFromTelegram}
                refreshKey={refreshKey}
            />
        )}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Transacciones</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Transacción
        </button>
      </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white shadow-md rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50">
                <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600">Descripción</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Categoría</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Fecha</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-right">Monto</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-center">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {transactions.map(t => {
                    const category = getCategory(t.categoryId);
                    return (
                    <tr key={t.id} className="border-b hover:bg-slate-50">
                        <td className="p-4">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">{category?.icon || '📁'}</span>
                            <div>
                                <p className="font-medium text-slate-800">{t.description}</p>
                                <p className="text-xs text-slate-500">{getMember(t.memberId)?.username}</p>
                            </div>
                        </div>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{category?.name}</td>
                        <td className="p-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                        <td className={`p-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                        <div className="flex justify-center items-center space-x-2">
                            <button onClick={() => openModal(t)} className="p-2 text-slate-500 hover:text-zinc-700 rounded-full hover:bg-slate-100">
                            <EditIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100">
                            <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    )
                })}
                </tbody>
            </table>
            {transactions.length === 0 && (
                <p className="text-center text-slate-500 py-8">No hay transacciones registradas.</p>
            )}
            </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
            {transactions.map(t => {
                const category = getCategory(t.categoryId);
                const member = getMember(t.memberId);
                return (
                    <div key={t.id} className="bg-white rounded-2xl shadow-md p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{category?.icon || '📁'}</span>
                                <div>
                                    <p className="font-bold text-slate-800">{t.description}</p>
                                    <p className="text-sm text-slate-500">{category?.name || 'Sin categoría'}</p>
                                </div>
                            </div>
                            <div className={`text-lg font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                            <p>{new Date(t.date).toLocaleDateString()}{member ? ` por ${member.username}` : ''}</p>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => openModal(t)} className="p-2 text-slate-500 hover:text-zinc-700 rounded-full hover:bg-slate-100">
                                    <EditIcon className="h-4 w-4" />
                                </button>
                                <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
             {transactions.length === 0 && (
                <div className="bg-white rounded-3xl shadow-md p-4">
                    <p className="text-center text-slate-500 py-8">No hay transacciones registradas.</p>
                </div>
            )}
        </div>


      <TransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default TransactionsScreen;