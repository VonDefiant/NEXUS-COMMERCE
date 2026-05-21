import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  cost: number;
}

interface PurchaseItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  cost: number;
  subtotal: number;
}

interface Purchase {
  id: string;
  number: string;
  status: 'pending' | 'received' | 'cancelled';
  supplier: Supplier;
  total: number;
  createdAt: string;
  items: PurchaseItem[];
}

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    notes: '',
    tax: 0,
    items: [] as Omit<PurchaseItem, 'subtotal'>[],
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/v1/purchases', { headers }),
        fetch('/api/v1/suppliers', { headers }),
        fetch('/api/v1/products', { headers })
      ]);
      
      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReceive = async (id: string) => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch(`/api/v1/purchases/${id}/receive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Compra recibida. Stock actualizado.');
        fetchData();
      } else {
        toast.error('Error al recibir compra');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, cost: 0 }]
    });
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto complete cost when product selected
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) newItems[index].cost = prod.cost || 0;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) return toast.error('Selecciona un proveedor');
    if (formData.items.length === 0) return toast.error('Añade al menos un producto');
    if (formData.items.some(i => !i.productId)) return toast.error('Selecciona un producto para todos los items');

    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch('/api/v1/purchases', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Orden de compra creada');
        setIsModalOpen(false);
        setFormData({ supplierId: '', notes: '', tax: 0, items: [] });
        fetchData();
      } else {
        toast.error('Error al crear orden');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compras</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Órdenes de compra y recepción de inventario</p>
        </div>
        <button
          onClick={() => {
            setFormData({ supplierId: '', notes: '', tax: 0, items: [] });
            setIsModalOpen(true);
          }}
          className="bg-nexus-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={16} />
          Nueva Compra
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar ordene (ej. OC-0001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent focus:border-transparent dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Número</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Cargando compras...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                      {purchase.number}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {purchase.supplier?.name || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-900 dark:text-white">
                      ${purchase.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {purchase.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-medium">
                          <Clock size={14} /> Pendiente
                        </span>
                      )}
                      {purchase.status === 'received' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">
                          <CheckCircle size={14} /> Recibida
                        </span>
                      )}
                      {purchase.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-2.5 py-1 rounded-full text-xs font-medium">
                          <XCircle size={14} /> Cancelada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {purchase.status === 'pending' && (
                        <button
                          onClick={() => handleReceive(purchase.id)}
                          className="px-3 py-1.5 text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded border transition-colors"
                        >
                          Recibir
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Orden de Compra</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor *</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full pl-3 pr-10 py-2 appearance-none bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent dark:text-white"
                      >
                        <option value="">Selecciona un proveedor</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Productos *</label>
                    <button type="button" onClick={handleAddItem} className="text-sm text-nexus-accent hover:text-blue-600 font-medium">+ Agregar Item</button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Producto</th>
                          <th className="px-3 py-2 w-24">Cant.</th>
                          <th className="px-3 py-2 w-32">Costo (U)</th>
                          <th className="px-3 py-2 w-32">Subtotal</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {formData.items.length === 0 ? (
                          <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">Haz clic en + Agregar Item</td></tr>
                        ) : (
                          formData.items.map((item, i) => (
                            <tr key={i}>
                              <td className="p-2">
                                <select
                                  required
                                  value={item.productId}
                                  onChange={(e) => handleItemChange(i, 'productId', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-sm dark:text-white"
                                >
                                  <option value="">Seleccionar...</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number" required min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(i, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-sm dark:text-white"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number" required min="0" step="0.01"
                                  value={item.cost}
                                  onChange={(e) => handleItemChange(i, 'cost', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-sm dark:text-white"
                                />
                              </td>
                              <td className="p-2 text-slate-900 dark:text-white font-mono">
                                ${(item.quantity * item.cost).toFixed(2)}
                              </td>
                              <td className="p-2 text-center">
                                <button type="button" onClick={() => handleRemoveItem(i)} className="text-slate-400 hover:text-red-500">
                                  <XCircle size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {formData.items.length > 0 && (
                    <div className="mt-4 flex justify-end">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg w-48 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-400">
                          <span>Subtotal:</span>
                          <span className="font-mono text-slate-900 dark:text-white">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 text-slate-900 dark:text-white">
                          <span>Total:</span>
                          <span className="font-mono text-nexus-accent">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent dark:text-white"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formData.items.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-nexus-accent hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors border border-transparent shadow-sm"
                >
                  Crear Orden de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
