import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { Skeleton } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';

const revenueData = [
  { name: 'Ene', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Abr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 7000 },
  { name: 'Jul', value: 8500 },
];

const salesData = [
  { name: 'Lun', sales: 120 },
  { name: 'Mar', sales: 132 },
  { name: 'Mié', sales: 101 },
  { name: 'Jue', sales: 143 },
  { name: 'Vie', sales: 190 },
  { name: 'Sáb', sales: 230 },
  { name: 'Dom', sales: 210 },
];

export function DashboardPage() {
  const { theme } = useAppStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  // Colors adapted to theme
  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const chartGridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : 'none';
  const tooltipText = isDark ? '#f8fafc' : '#1a2444';
  const primaryChartColor = isDark ? '#60a5fa' : '#1a2444';
  const accentChartColor = isDark ? '#3b82f6' : '#3b82f6';
  const gridStrokeDasharray = "3 3";

  // Simulate network load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const kpis = [
    {
      title: t('dashboard.totalRevenue'),
      value: "$124,563.00",
      change: "+14.5%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: t('dashboard.activeUsers'),
      value: "8,432",
      change: "+5.2%",
      isPositive: true,
      icon: Users,
    },
    {
      title: t('dashboard.salesConversion'),
      value: "3.24%",
      change: "-1.1%",
      isPositive: false,
      icon: Activity,
    },
    {
      title: t('dashboard.growthRate'),
      value: "24.8%",
      change: "+2.4%",
      isPositive: true,
      icon: TrendingUp,
    }
  ];

  if (isLoading) {
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
          <Skeleton className="xl:col-span-3 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* KPIs Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{kpi.title}</p>
                  <h3 className="text-2xl lg:text-[26px] xl:text-[24px] 2xl:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tracking-tight truncate">{kpi.value}</h3>
                </div>
                <div className="flex-shrink-0 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-nexus-primary group-hover:text-white dark:group-hover:bg-nexus-accent transition-colors">
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-medium ${
                  kpi.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {kpi.isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                  {kpi.change}
                </span>
                <span className="text-slate-500 dark:text-slate-500 ml-2">{t('dashboard.vsLastMonth')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Bento Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Large Chart: Area Spread */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('dashboard.revenueSummary')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.revenueDesc')}</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-nexus-accent outline-none">
              <option>{t('dashboard.thisYear')}</option>
              <option>{t('dashboard.lastYear')}</option>
            </select>
          </div>
          <div className="p-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryChartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={primaryChartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray={gridStrokeDasharray} vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTextColor }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTextColor }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: tooltipBorder !== 'none' ? `1px solid ${tooltipBorder}` : 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: tooltipText, fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="value" stroke={primaryChartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Data: Bar Volume */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('dashboard.salesVolume')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.salesVolumeDesc')}</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="p-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray={gridStrokeDasharray} vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTextColor }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTextColor }} />
                <Tooltip 
                  cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                  contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: tooltipBorder !== 'none' ? `1px solid ${tooltipBorder}` : 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: tooltipText, fontWeight: 600 }}
                />
                <Bar dataKey="sales" fill={accentChartColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Wide Bento: Transactions */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.recentTransactions')}</h3>
            <button className="text-sm font-medium text-nexus-accent hover:text-nexus-primary dark:hover:text-blue-400 transition-colors">{t('dashboard.viewAll')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('dashboard.tableId')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.tableCustomer')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.tableDate')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.tableAmount')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {[
                  { id: "TRX-8932", customer: "Empresa Alfa S.A.", date: "15 May 2024", amount: "$1,250.00", status: t('dashboard.statusCompleted'), originStatus: 'Completada' },
                  { id: "TRX-8931", customer: "María González", date: "15 May 2024", amount: "$340.50", status: t('dashboard.statusPending'), originStatus: 'Pendiente' },
                  { id: "TRX-8930", customer: "Tech Solutions Inc.", date: "14 May 2024", amount: "$4,500.00", status: t('dashboard.statusCompleted'), originStatus: 'Completada' },
                  { id: "TRX-8929", customer: "Juan Pérez", date: "13 May 2024", amount: "$125.00", status: t('dashboard.statusCancelled'), originStatus: 'Cancelada' },
                ].map((trx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{trx.id}</td>
                    <td className="px-4 py-3">{trx.customer}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{trx.date}</td>
                    <td className="px-4 py-3 font-medium">{trx.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        trx.originStatus === 'Completada' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 
                        trx.originStatus === 'Pendiente' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' : 
                        'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                      }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
