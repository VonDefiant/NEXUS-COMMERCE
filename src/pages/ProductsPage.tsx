import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, X } from 'lucide-react';

export function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', cost: 0, price: 0, minStock: 0, categoryId: ''
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [resProd, resCat] = await Promise.all([
        fetch('/api/v1/products', { headers }),
        fetch('/api/v1/categories', { headers })
      ]);
      if (resProd.ok) setProducts(await resProd.json());
      if (resCat.ok) setCategories(await resCat.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name, sku: product.sku || '', barcode: product.barcode || '',
        cost: product.cost || 0, price: product.price || 0, minStock: product.minStock || 0,
        categoryId: product.categoryId || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', sku: '', barcode: '', cost: 0, price: 0, minStock: 0, categoryId: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const url = editingId ? `/api/v1/products-mgmt/${editingId}` : '/api/v1/products-mgmt';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Error guardando producto');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch(`/api/v1/products-mgmt/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Productos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona tu inventario y catálogo de productos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 bg-nexus-primary hover:bg-nexus-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto">
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando productos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No se encontraron productos. Crea uno nevo o cambia tu búsqueda.
            </div>
          ) : (
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
                {filteredProducts.map((product) => {
                  let status = 'Agotado';
                  let statusClass = 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400';
                  
                  if (product.stock > product.minStock) {
                    status = 'En Stock';
                    statusClass = 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
                  } else if (product.stock > 0) {
                    status = 'Poco Stock';
                    statusClass = 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
                  }

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200">{product.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{product.sku || 'Sin SKU'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{product.category?.name || 'Sin categoría'}</td>
                      <td className="px-6 py-4 font-mono text-slate-900 dark:text-slate-200">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">{product.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenModal(product)} className="p-1.5 text-slate-400 hover:text-nexus-accent dark:hover:text-blue-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button onClick={() => setShowModal(false)}><X className="text-slate-500" /></button>
             </div>
             <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <option value="">Sin categoría</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Costo ($)</label>
                    <input type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio ($)</label>
                    <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Mínimo (Alerta)</label>
                  <input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
             </div>
             <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
               <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50">Cancelar</button>
               <button onClick={handleSave} disabled={!formData.name.trim()} className="px-4 py-2 bg-nexus-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">Guardar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
