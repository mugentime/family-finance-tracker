import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TrashIcon } from '../components/Icons';
import type { Product, CartItem, ServiceType, PaymentMethod } from '../types';

const ProductCard: React.FC<{ product: Product; onClick: () => void; }> = ({ product, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 group flex flex-col"
    >
        <img src={product.imageUrl} alt={product.name} className="h-40 w-full object-cover" />
        <div className="p-3 flex-1 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-zinc-700">{product.name}</h3>
            <p className="text-lg font-bold text-slate-900 mt-1">${product.price.toFixed(2)}</p>
        </div>
    </div>
);

const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
    const { updateCartQuantity, removeFromCart } = useAppContext();
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex-1">
                <p className="font-medium text-sm text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center">
                <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                    className="w-14 text-center border-slate-300 rounded-lg shadow-sm py-1 text-sm mx-2"
                    min="1"
                />
            </div>
            <p className="w-16 text-right font-medium text-sm text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
            <button onClick={() => removeFromCart(item.id)} className="ml-2 p-1 text-slate-500 hover:text-red-600 rounded-full">
                <TrashIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

const CheckoutModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: { clientName?: string; serviceType: ServiceType; paymentMethod: PaymentMethod }) => void;
    cartTotal: number;
}> = ({ isOpen, onClose, onConfirm, cartTotal }) => {
    const [clientName, setClientName] = useState('');
    const [serviceType, setServiceType] = useState<ServiceType>('Mesa');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');

    if (!isOpen) return null;

    const handleConfirmClick = () => {
        onConfirm({ clientName, serviceType, paymentMethod });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Finalizar Orden</h2>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-slate-600">Nombre del Cliente (Opcional)</label>
                            <input type="text" name="clientName" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-1.5 px-2 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="serviceType" className="block text-sm font-medium text-slate-600">Tipo de Servicio</label>
                            <select name="serviceType" id="serviceType" value={serviceType} onChange={(e) => setServiceType(e.target.value as any)} className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-1.5 px-2 sm:text-sm">
                                <option>Mesa</option>
                                <option>Para llevar</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-600">Método de Pago</label>
                             <select name="paymentMethod" id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full border border-slate-300 rounded-xl shadow-sm py-1.5 px-2 sm:text-sm">
                                <option>Efectivo</option>
                                <option>Tarjeta</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex flex-col gap-3 rounded-b-3xl">
                     <div className="flex justify-between text-xl font-bold">
                        <span className="text-slate-900">Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">Cancelar</button>
                        <button type="button" onClick={handleConfirmClick} className="w-full py-3 px-4 bg-zinc-900 rounded-xl text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">Pagar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Cart: React.FC = () => {
    const { cart, cartTotal, createOrder, clearCart } = useAppContext();
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmCheckout = (orderDetails: { clientName?: string; serviceType: ServiceType; paymentMethod: PaymentMethod }) => {
        createOrder(orderDetails);
        setIsCheckoutModalOpen(false);
    };

    return (
        <div className="bg-white rounded-3xl shadow-md flex flex-col lg:h-full">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-slate-800">Orden Actual</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {cart.length > 0 ? (
                    cart.map(item => <CartItemRow key={item.id} item={item} />)
                ) : (
                    <p className="text-center text-slate-500 mt-8">El carrito está vacío.</p>
                )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 rounded-b-3xl">
                 <div className="space-y-2 text-sm mb-4">
                     <div className="flex justify-between text-lg font-bold">
                        <span className="text-slate-900">Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                     <button onClick={clearCart} className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                        Limpiar
                    </button>
                    <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full py-3 px-4 bg-zinc-900 rounded-xl text-sm font-semibold text-white hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed">
                        Cobrar
                    </button>
                </div>
            </div>
            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
                onConfirm={handleConfirmCheckout}
                cartTotal={cartTotal}
            />
        </div>
    );
}

const SalesScreen: React.FC = () => {
    const { products, addToCart } = useAppContext();

    const groupedProducts = products.reduce((acc, product) => {
        const category = product.category || 'Sin categoría';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(product);
        return acc;
    }, {} as Record<string, Product[]>);
  
    return (
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:h-full">
            <div className="lg:col-span-2 lg:overflow-y-auto lg:pr-2">
                <h1 className="text-3xl font-bold text-slate-800 mb-6 sticky top-0 bg-gray-100/80 backdrop-blur-sm py-2 z-10">Punto de Venta</h1>
                {Object.entries(groupedProducts).map(([category, productsInCategory]) => (
                    <div key={category} className="mb-8">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">{category}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productsInCategory.map(product => (
                                <ProductCard key={product.id} product={product} onClick={() => addToCart(product)} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 lg:mt-0 lg:col-span-1">
                <Cart />
            </div>
        </div>
    );
};

export default SalesScreen;