import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'En Stock' | 'Poco Stock' | 'Agotado';
}

const mockProducts: Product[] = [
  { id: 'PRD-001', name: 'Servidor Enterprise Blade', category: 'Hardware', price: 2499.99, stock: 45, status: 'En Stock' },
  { id: 'PRD-002', name: 'Almacenamiento Cloud 1TB', category: 'Software', price: 12.99, stock: 999, status: 'En Stock' },
  { id: 'PRD-003', name: 'Switch de Red 48-Puertos', category: 'Hardware', price: 899.00, stock: 5, status: 'Poco Stock' },
  { id: 'PRD-004', name: 'Firewall de Seguridad Pro', category: 'Hardware', price: 1250.00, stock: 0, status: 'Agotado' },
  { id: 'PRD-005', name: 'Licencia Dashboard Analíticas', category: 'Software', price: 299.00, stock: 999, status: 'En Stock' },
  { id: 'PRD-006', name: 'Punto de Acceso Inalámbrico', category: 'Hardware', price: 149.50, stock: 12, status: 'Poco Stock' },
  { id: 'PRD-007', name: 'Sistema de Gestión de Base de Datos', category: 'Software', price: 499.99, stock: 999, status: 'En Stock' },
];

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Productos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona tu inventario y catálogo de productos.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-nexus-primary hover:bg-nexus-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto">
          <Plus size={16} />
          Agregar Producto
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-nexus-border dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto justify-center">
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-nexus-border dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre del Producto</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Precio</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border dark:divide-slate-800">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-200">{product.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{product.id}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{product.category}</td>
                  <td className="px-6 py-4 font-mono text-slate-900 dark:text-slate-200">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${product.status === 'En Stock' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 
                        product.status === 'Poco Stock' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 
                        'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-nexus-accent dark:hover:text-blue-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-nexus-border dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="text-center sm:text-left">Mostrando 1 a 7 de 24 resultados</div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">Ant</button>
            <button className="px-3 py-1 border border-nexus-primary bg-nexus-primary text-white rounded-md">1</button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 hidden sm:block">2</button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 hidden sm:block">3</button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">Sig</button>
          </div>
        </div>
      </div>
    </div>
  );
}
