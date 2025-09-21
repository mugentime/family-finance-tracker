import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

interface PendingTransaction {
    id: string;
    description: string;
    amount: number;
    date: string;
}

const TelegramImportScreen: React.FC = () => {
    const { addTransaction } = useAppContext();
    const [telegramId, setTelegramId] = useState('');
    const [pending, setPending] = useState<PendingTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const fetchPendingTransactions = async () => {
        if (!telegramId) {
            setError('Por favor, ingresa tu ID de usuario de Telegram.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSearched(true);
        try {
            const response = await fetch(`/api/pending-transactions/${telegramId}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor.');
            const data = await response.json();
            setPending(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (transaction: PendingTransaction) => {
        // Añade la transacción a la app (localStorage)
        addTransaction({
            description: transaction.description,
            amount: transaction.amount,
            date: new Date(transaction.date).toISOString(),
            type: 'expense', // Por defecto los recibos son gastos
            categoryId: 'cat-exp-8' // Categoría "Otro" por defecto
        });

        // Notifica al backend para que la elimine de pendientes
        try {
            await fetch('/api/confirm-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramId, transactionId: transaction.id }),
            });
            // Elimina de la lista local
            setPending(prev => prev.filter(t => t.id !== transaction.id));
        } catch (err) {
            console.error("Error al confirmar la transacción:", err);
            alert("La transacción fue añadida, pero hubo un problema al limpiarla del servidor.");
        }
    };
    
    const handleDiscard = async (transactionId: string) => {
        try {
             await fetch('/api/confirm-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramId, transactionId }),
            });
            setPending(prev => prev.filter(t => t.id !== transactionId));
        } catch (err) {
             console.error("Error al descartar la transacción:", err);
             alert("Hubo un problema al descartar la transacción en el servidor.");
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Importar desde Telegram</h1>
            <p className="text-slate-600 mb-6">Importa transacciones escaneadas desde recibos enviados a tu bot.</p>

            <div className="bg-white p-6 rounded-3xl shadow-md mb-6">
                <h2 className="text-lg font-bold text-slate-800 mb-2">Conectar con Telegram</h2>
                <p className="text-sm text-slate-500 mb-4">Ingresa tu ID de usuario de Telegram para buscar transacciones pendientes.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={telegramId}
                        onChange={e => setTelegramId(e.target.value)}
                        placeholder="Tu ID de Telegram"
                        className="flex-grow mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
                    />
                    <button 
                        onClick={fetchPendingTransactions}
                        disabled={isLoading}
                        className="px-5 py-2 bg-zinc-900 text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors disabled:bg-zinc-400"
                    >
                        {isLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
                 {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                 <div className="text-xs text-slate-400 mt-3">
                    <p>ℹ️ Para encontrar tu ID, envía el comando `/id` a tu bot en Telegram.</p>
                 </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-md">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Transacciones Pendientes</h2>
                {isLoading ? (
                    <p className="text-center text-slate-500">Buscando...</p>
                ) : searched && pending.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">No se encontraron transacciones pendientes para este ID.</p>
                ) : (
                    <ul className="space-y-3">
                        {pending.map(t => (
                            <li key={t.id} className="p-3 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex-grow">
                                    <p className="font-medium text-slate-800">{t.description}</p>
                                    <p className="text-sm text-slate-500">{new Date(t.date + 'T00:00:00').toLocaleDateString()} - <span className="font-bold text-red-600">${t.amount.toFixed(2)}</span></p>
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <button onClick={() => handleDiscard(t.id)} className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">Descartar</button>
                                    <button onClick={() => handleApprove(t)} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Aprobar</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TelegramImportScreen;