import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Download, Filter, Plus, X } from 'lucide-react';

interface Sale {
  id: string;
  number: string;
  customer?: { name: string; email: string };
  createdAt: string;
  total: number;
  status: string;
  items: any[];
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch('/api/v1/sales', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setSales(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [resCust, resProd] = await Promise.all([
        fetch('/api/v1/customers', { headers }),
        fetch('/api/v1/products', { headers })
      ]);
      if (resCust.ok) setCustomers(await resCust.json());
      if (resProd.ok) setProducts(await resProd.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchDependencies();
  }, []);

  const addProductToSale = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      if (existing) {
        return prev.map(p => p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => prev.map(p => p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p));
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const handleCreateSale = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch('/api/v1/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          items: selectedProducts,
          discount,
          status: 'completed'
        })
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedProducts([]);
        setSelectedCustomerId('');
        setDiscount(0);
        fetchSales();
      } else {
        const error = await res.json();
        alert(error.error || 'Error creando venta');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red');
    }
  };

  const currentMonthSales = sales.filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth());
  const pendingSales = sales.filter(s => s.status === 'pending');
  const failedSales = sales.filter(s => s.status === 'cancelled');

  const totalCurrentMonth = currentMonthSales.reduce((acc, s) => acc + s.total, 0);
  const totalPending = pendingSales.reduce((acc, s) => acc + s.total, 0);
  const totalFailed = failedSales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ventas y Facturas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rastrea tus transacciones recientes e ingresos.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-nexus-primary hover:bg-nexus-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Ventas Totales (Este Mes)</p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono text-ellipsis overflow-hidden">${totalCurrentMonth.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Facturas Pendientes</p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono text-ellipsis overflow-hidden">${totalPending.toFixed(2)}</h3>
            <span className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 shrink-0">
              {pendingSales.length} facturas
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Transacciones Canceladas</p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono text-ellipsis overflow-hidden">${totalFailed.toFixed(2)}</h3>
            <span className="flex items-center text-sm font-medium text-rose-600 dark:text-rose-400 mb-1 shrink-0">
              {failedSales.length} facturas
            </span>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-nexus-border dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Transacciones Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          {sales.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p>No hay ventas registradas.</p>
              <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium">Hacer la primera venta</button>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-nexus-border dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Factura</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Monto</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-border dark:divide-slate-800">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-900 dark:text-slate-300 font-medium">{sale.number || sale.id.substring(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-200">{sale.customer?.name || 'Cliente Final'}</div>
                      {sale.customer?.email && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sale.customer.email}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-200">${sale.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${sale.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 
                          sale.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 
                          'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}
                      >
                        {sale.status === 'completed' ? 'Completado' : sale.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">Nueva Venta</h3>
                <button onClick={() => setShowModal(false)}><X className="text-slate-500" /></button>
             </div>
             <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente (Opcional)</label>
                  <select 
                    value={selectedCustomerId} 
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Cliente Final (Sin registrar)</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Agregar Producto</label>
                  <select 
                    onChange={e => { if(e.target.value) addProductToSale(e.target.value); e.target.value=''; }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">-- Seleccionar Producto --</option>
                    {products.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>)}
                  </select>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Producto</th>
                        <th className="px-3 py-2">Cantidad</th>
                        <th className="px-3 py-2 text-right">Precio</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2">
                             <input type="number" min="1" value={p.quantity} onChange={e => updateQuantity(p.productId, parseInt(e.target.value))} className="w-16 border rounded px-1"/>
                          </td>
                          <td className="px-3 py-2 text-right">${p.price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">${(p.price * p.quantity).toFixed(2)}</td>
                          <td className="px-3 py-2 text-center text-red-500 cursor-pointer" onClick={() => removeProduct(p.productId)}>
                            <X size={16} className="mx-auto" />
                          </td>
                        </tr>
                      ))}
                      {selectedProducts.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">No hay productos</td></tr>}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-4 items-center pt-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Descuento:</label>
                    <input type="number" min="0" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 border rounded px-2 py-1 text-right" />
                  </div>
                  <div className="text-xl font-bold">
                    Total: ${(selectedProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0) - discount).toFixed(2)}
                  </div>
                </div>

             </div>
             <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
               <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hove:bg-slate-50">Cancelar</button>
               <button onClick={handleCreateSale} disabled={selectedProducts.length === 0} className="px-4 py-2 bg-nexus-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">Crear Venta</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
