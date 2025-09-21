import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import ProductModal from '../components/ProductModal';
import ImportProductsModal from '../components/ImportProductsModal';
import { PlusIcon, EditIcon, TrashIcon, UploadIcon } from '../components/Icons';
import type { Product } from '../types';

const ProductsScreen: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const openModal = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setProductToEdit(null);
    setIsModalOpen(false);
  };

  const handleSave = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      updateProduct(productData as Product);
    } else {
      addProduct(productData);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Productos</h1>
        <div className="flex items-center space-x-2">
           <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            <UploadIcon className="h-5 w-5 mr-2" />
            Importar
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="bg-white shadow-md rounded-3xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50">
                <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600">Producto</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Categoría</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Precio</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Costo</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Stock</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {products.map(product => (
                <tr key={product.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                        <div className="flex items-center">
                            <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-xl object-cover mr-4" />
                            <div>
                                <p className="font-medium text-slate-800">{product.name}</p>
                                <p className="text-xs text-slate-500 max-w-xs truncate">{product.description}</p>
                            </div>
                        </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{product.category}</td>
                    <td className="p-4 text-sm text-slate-800 font-medium">${product.price.toFixed(2)}</td>
                    <td className="p-4 text-sm text-slate-500">${product.cost.toFixed(2)}</td>
                    <td className="p-4 text-sm text-slate-500">{product.stock}</td>
                    <td className="p-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                        <button onClick={() => openModal(product)} className="p-2 text-slate-500 hover:text-zinc-700 rounded-full hover:bg-slate-100 transition-colors">
                            <EditIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
        {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                <div className="p-4 flex-1">
                    <div className="flex items-start gap-4">
                        <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 leading-tight">{product.name}</p>
                            <p className="text-sm text-slate-500">{product.category}</p>
                            <span className="text-lg font-semibold text-zinc-800">${product.price.toFixed(2)}</span>
                        </div>
                    </div>
                    {product.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{product.description}</p>}
                </div>
                 <div className="bg-slate-50 px-4 py-2 flex justify-between items-center text-sm text-slate-600">
                    <div className="flex gap-4">
                        <div>
                            <div className="text-xs text-slate-500">Costo</div>
                            <div className="font-medium">${product.cost.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">Stock</div>
                            <div className="font-medium">{product.stock}</div>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <button onClick={() => openModal(product)} className="p-2 text-slate-500 hover:text-zinc-700 rounded-full">
                            <EditIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>


      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        productToEdit={productToEdit}
      />
      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

export default ProductsScreen;