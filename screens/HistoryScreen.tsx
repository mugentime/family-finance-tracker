import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Order } from '../types';

const OrderDetailsModal: React.FC<{ order: Order, onClose: () => void }> = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Detalles de la Orden</h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">ID: {order.id}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 -mt-2 -mr-2 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Fecha: {new Date(order.date).toLocaleString()}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                    <div>Cliente: <span className="font-medium text-slate-700 block">{order.clientName || 'N/A'}</span></div>
                    <div>Servicio: <span className="font-medium text-slate-700 block">{order.serviceType}</span></div>
                    <div>Pago: <span className="font-medium text-slate-700 block">{order.paymentMethod}</span></div>
                </div>

                <div className="border-t border-b py-2 my-4 space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm pr-2">
                            <div>
                                <p className="font-medium text-slate-800">{item.name}</p>
                                <p className="text-slate-500">{item.quantity} x ${item.price.toFixed(2)}</p>
                            </div>
                            <p className="text-slate-700 font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-base font-bold pt-2 border-t mt-2"><span className="text-slate-800">Total:</span> <span>${order.total.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end rounded-b-3xl">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-900 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500">Cerrar</button>
            </div>
        </div>
    </div>
);

const HistoryScreen: React.FC = () => {
    const { orders } = useAppContext();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Historial de Órdenes</h1>
            
            {/* Desktop Table View */}
            <div className="bg-white shadow-md rounded-3xl overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-slate-600">ID Orden</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Fecha</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Items</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Total</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b hover:bg-slate-50">
                                    <td className="p-4 text-sm text-slate-800 font-mono">{order.id}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(order.date).toLocaleString()}</td>
                                    <td className="p-4 text-sm text-slate-500">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                                    <td className="p-4 text-sm text-slate-800 font-medium text-right">${order.total.toFixed(2)}</td>
                                    <td className="p-4 text-sm text-center">
                                        <button onClick={() => setSelectedOrder(order)} className="text-zinc-700 hover:underline font-medium">Ver Detalles</button>
                                    </td>
                                </tr>
                            ))}
                             {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center text-slate-500 py-8">No hay órdenes registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-md p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-mono text-sm text-slate-700 font-semibold">{order.id}</p>
                                <p className="text-xs text-slate-500">{new Date(order.date).toLocaleString()}</p>
                            </div>
                            <p className="text-lg font-bold text-slate-800">${order.total.toFixed(2)}</p>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                            <p className="text-sm text-slate-600">{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</p>
                            <button onClick={() => setSelectedOrder(order)} className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200">Ver Detalles</button>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="bg-white rounded-3xl shadow-md p-4 md:hidden">
                    <p className="text-center text-slate-500 py-8">No hay órdenes registradas.</p>
                </div>
            )}
            
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </div>
    );
};

export default HistoryScreen;