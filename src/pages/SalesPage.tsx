import React from 'react';
import { ArrowUpRight, ArrowDownRight, Download, Filter } from 'lucide-react';

interface Sale {
  id: string;
  customer: string;
  email: string;
  date: string;
  amount: number;
  status: 'Completado' | 'Pendiente' | 'Fallido';
}

const mockSales: Sale[] = [
  { id: 'INV-3042', customer: 'Acme Corp', email: 'billing@acme.com', date: '2023-10-24', amount: 4500.00, status: 'Completado' },
  { id: 'INV-3043', customer: 'Globex Inc', email: 'finance@globex.com', date: '2023-10-24', amount: 1250.50, status: 'Completado' },
  { id: 'INV-3044', customer: 'Soylent Corp', email: 'accounts@soylent.com', date: '2023-10-23', amount: 890.00, status: 'Pendiente' },
  { id: 'INV-3045', customer: 'Initech', email: 'payments@initech.com', date: '2023-10-23', amount: 3200.00, status: 'Fallido' },
  { id: 'INV-3046', customer: 'Umbrella Corp', email: 'billing@umbrella.com', date: '2023-10-22', amount: 15000.00, status: 'Completado' },
  { id: 'INV-3047', customer: 'Massive Dynamic', email: 'finance@massive.com', date: '2023-10-21', amount: 450.00, status: 'Completado' },
];

export function SalesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ventas y Facturas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rastrea tus transacciones recientes e ingresos.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <Filter size={16} />
            Filtrar
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-nexus-primary hover:bg-nexus-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Ventas Totales (Este Mes)</p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono text-ellipsis overflow-hidden">$84,250.00</h3>
            <span className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1 shrink-0">
              <ArrowUpRight size={16} className="mr-0.5" /> 12.5%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Facturas Pendientes</p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono text-ellipsis overflow-hidden">$12,400.00</h3>
            <span className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 shrink-0">
              14 facturas
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Transacciones Fallidas</p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono text-ellipsis overflow-hidden">$3,200.00</h3>
            <span className="flex items-center text-sm font-medium text-rose-600 dark:text-rose-400 mb-1 shrink-0">
              <ArrowDownRight size={16} className="mr-0.5" /> 2.1%
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
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-nexus-border dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">ID Factura</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Monto</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border dark:divide-slate-800">
              {mockSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-900 dark:text-slate-300 font-medium">{sale.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-200">{sale.customer}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sale.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sale.date}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-200">${sale.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${sale.status === 'Completado' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 
                        sale.status === 'Pendiente' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 
                        'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}
                    >
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-nexus-border dark:border-slate-800 text-center">
          <button className="text-sm font-medium text-nexus-accent dark:text-blue-400 hover:text-nexus-primary dark:hover:text-blue-300 transition-colors">
            Ver Todas las Transacciones
          </button>
        </div>
      </div>
    </div>
  );
}
