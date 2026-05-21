import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Skeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface DashboardStats {
  ventasMes: number;
  ventasMesAnterior: number;
  crecimiento: number;
  gastosMes: number;
  utilidadMes: number;
  totalVentasMes: number;
  productosStockBajo: number;
  comprasPendientes: number;
  topProductos: { name: string; sku: string; quantity: number; subtotal: number }[];
  ventasUltimos7Dias: { dia: string; total: number }[];
}

export function DashboardPage() {
  const { theme } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('nexus_session_token');
        const res = await fetch('/api/v1/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setStats(await res.json());
        } else {
          toast.error('Error al cargar métricas');
        }
      } catch (error) {
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>

        {/* Charts Dashboard Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-[420px] rounded-2xl" />
          <Skeleton className="xl:col-span-1 h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Ventas del Mes',
      value: `$${stats.ventasMes.toFixed(2)}`,
      change: `${stats.crecimiento > 0 ? '+' : ''}${stats.crecimiento}%`,
      isPositive: stats.crecimiento >= 0,
      icon: DollarSign,
    },
    {
      title: 'Gastos del Mes',
      value: `$${stats.gastosMes.toFixed(2)}`,
      change: null,
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: 'Utilidad del Mes',
      value: `$${stats.utilidadMes.toFixed(2)}`,
      change: null,
      isPositive: stats.utilidadMes >= 0,
      icon: ActivityIcon,
      color: stats.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
    },
    {
      title: 'Total Ventas',
      value: stats.totalVentasMes.toString(),
      change: null,
      isPositive: true,
      icon: ShoppingCart,
    }
  ];

  const maxSale = Math.max(...stats.ventasUltimos7Dias.map(d => d.total), 1); // fallback to 1 to avoid / 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard General</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Resumen del rendimiento de tu negocio</p>
        </div>
        
        <div className="flex items-center gap-3">
          {stats.comprasPendientes > 0 && (
            <Link to="/purchases" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors">
              <Clock size={16} />
              {stats.comprasPendientes} compras pendientes
            </Link>
          )}
          {stats.productosStockBajo > 0 && (
            <Link to="/inventory" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
              <AlertTriangle size={16} />
              {stats.productosStockBajo} bajo en stock
            </Link>
          )}
        </div>
      </div>

      {/* KPIs Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{kpi.title}</p>
                  <h3 className={`text-2xl lg:text-[26px] xl:text-[24px] 2xl:text-3xl font-bold mt-2 font-mono tracking-tight truncate ${kpi.color ? kpi.color : 'text-slate-900 dark:text-white'}`}>
                    {kpi.value}
                  </h3>
                </div>
                <div className="flex-shrink-0 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-nexus-accent group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
              </div>
              {kpi.change !== null && (
                <div className="mt-4 flex items-center text-sm">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-medium ${
                    kpi.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                  }`}>
                    {kpi.isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {kpi.change}
                  </span>
                  <span className="text-slate-500 ml-2">vs mes anterior</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfica de Barras - Ventas Últimos 7 Días */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ventas (Últimos 7 días)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Rendimiento diario</p>
            </div>
            <Link to="/reports" className="text-sm font-medium text-nexus-accent hover:text-blue-600 flex items-center gap-1">
              Ver reporte <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 mt-4 relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-slate-100 dark:border-slate-800/50 w-full"></div>
              <div className="border-t border-slate-100 dark:border-slate-800/50 w-full"></div>
              <div className="border-t border-slate-100 dark:border-slate-800/50 w-full"></div>
              <div className="border-t border-slate-100 dark:border-slate-800/50 w-full"></div>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            </div>

            {stats.ventasUltimos7Dias.map((day, ix) => {
              const heightPct = (day.total / maxSale) * 100;
              return (
                <div key={ix} className="flex-1 flex flex-col items-center gap-2 group relative z-10 h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs px-2 py-1 rounded font-mono shadow-sm pointer-events-none whitespace-nowrap">
                    ${day.total.toFixed(2)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[48px] bg-nexus-accent/80 hover:bg-nexus-accent rounded-t-lg transition-all duration-300 min-h-[4px]"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Productos del Mes */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top 5 Productos</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Más vendidos este mes</p>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {stats.topProductos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                No hay ventas este mes aún.
              </div>
            ) : (
              stats.topProductos.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4 justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm border border-slate-100 dark:border-slate-700">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={product.name}>{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} unidades vendidas</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">${product.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Inline fallback icon for Activity if it wasn't imported correctly top
function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

