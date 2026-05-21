import React, { useState, useEffect } from 'react';
import { ShieldAlert, History, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCategory {
  name: string;
  color: string;
}

interface ProductAlert {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  minStock: number;
  category: ProductCategory | null;
}

interface Product {
  name: string;
}

interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  before: number;
  after: number;
  createdAt: string;
  product: Product;
}

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'kardex'>('alerts');
  const [loading, setLoading] = useState(true);
  
  // Tab 1 state
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  
  // Tab 2 state
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductAlert | null>(null);
  const [adjustData, setAdjustData] = useState({
    quantity: 0,
    reason: 'adjustment',
  });

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch('/api/v1/inventory/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAlerts(await res.json());
    } catch (e) {
      toast.error('Error al cargar alertas');
    }
  };

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch('/api/v1/inventory/movements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMovements(await res.json());
    } catch (e) {
      toast.error('Error al cargar movimientos');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAlerts(), fetchMovements()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (adjustData.quantity === 0) {
      toast.error('La cantidad no puede ser cero');
      return;
    }

    try {
      const token = localStorage.getItem('nexus_session_token');
      const res = await fetch('/api/v1/inventory/adjust', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: adjustData.quantity,
          reason: adjustData.reason,
        }),
      });

      if (res.ok) {
        toast.success('Stock ajustado correctamente');
        setIsModalOpen(false);
        fetchAllData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al ajustar stock');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'in': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'out': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
      case 'adjustment': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowDownToLine size={14} className="mr-1" />;
      case 'out': return <ArrowUpFromLine size={14} className="mr-1" />;
      case 'adjustment': return <SlidersHorizontal size={14} className="mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control de stock y movimientos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'border-nexus-accent text-nexus-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <ShieldAlert size={18} />
            Alertas de Stock
            {alerts.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 py-0.5 px-2 rounded-full text-xs">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('kardex')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'kardex'
                ? 'border-nexus-accent text-nexus-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <History size={18} />
            Movimientos (Kardex)
          </button>
        </nav>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">Cargando datos...</div>
        ) : activeTab === 'alerts' ? (
          <div className="p-6">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <PackageSearch className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Todo en orden</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">No hay productos con stock por debajo del mínimo establecido.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map(product => (
                  <div key={product.id} className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1" title={product.name}>{product.name}</h3>
                        <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs font-bold px-2 py-1 rounded">
                          {product.stock} disp.
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                        <p>Min. sugerido: {product.minStock}</p>
                        {product.sku && <p>SKU: {product.sku}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setAdjustData({ quantity: 0, reason: 'adjustment' });
                        setIsModalOpen(true);
                      }}
                      className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      Ajustar Stock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4 text-center">Antes / Después</th>
                  <th className="px-6 py-4">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay movimientos registrados.</td>
                  </tr>
                ) : (
                  movements.map(mov => (
                    <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-xs truncate" title={mov.product.name}>
                        {mov.product.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeStyle(mov.type)}`}>
                          {getTypeIcon(mov.type)}
                          {mov.type === 'in' ? 'Entrada' : mov.type === 'out' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-mono font-bold ${mov.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : mov.type === 'out' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-slate-500 dark:text-slate-400">
                        {mov.before} &rarr; <span className="font-bold text-slate-900 dark:text-white">{mov.after}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {mov.reason === 'sale' ? 'Venta' : mov.reason === 'purchase' ? 'Compra' : mov.reason === 'adjustment' ? 'Ajuste manual' : mov.reason || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Ajuste */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ajustar Stock</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedProduct.name}</p>
            </div>
            
            <form onSubmit={handleAdjustStock}>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex justify-between font-mono text-sm border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Stock Actual:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedProduct.stock} unidades</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad a ajustar (usa negativos para restar)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent dark:text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1 mt-2">
                    Nuevo stock quedará en: <strong className={selectedProduct.stock + adjustData.quantity < 0 ? 'text-red-500' : ''}>{selectedProduct.stock + adjustData.quantity}</strong>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo</label>
                  <input
                    type="text"
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                    placeholder="Ej. Inventario físico, merma..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent dark:text-white"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedProduct.stock + adjustData.quantity < 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-nexus-accent hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors border border-transparent shadow-sm"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
