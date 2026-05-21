import React from 'react';
import { FileText, Download, FileSpreadsheet, Calendar, PieChart } from 'lucide-react';

export function ReportsPage() {
  const reports = [
    { id: 1, name: 'Resumen Mensual de Ingresos', date: 'Oct 2023', type: 'Financiero', size: '2.4 MB' },
    { id: 2, name: 'Métricas de Rendimiento Q3', date: 'Sep 2023', type: 'Analíticas', size: '4.1 MB' },
    { id: 3, name: 'Valoración de Inventario', date: 'Oct 24, 2023', type: 'Inventario', size: '1.8 MB' },
    { id: 4, name: 'Análisis de Rotación de Clientes', date: 'Q3 2023', type: 'Clientes', size: '3.2 MB' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reportes y Analíticas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Genera y descarga reportes de tu negocio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Report Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-nexus-primary/10 rounded-lg text-nexus-primary dark:text-blue-400">
              <PieChart size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Generar Reporte Personalizado</h3>
          </div>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Reporte</label>
              <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all">
                <option>Resumen Financiero</option>
                <option>Ventas por Producto</option>
                <option>Estado de Inventario</option>
                <option>Actividad de Usuarios</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de Inicio</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="date" className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de Fin</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="date" className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button type="button" className="flex-1 flex justify-center items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                <FileText size={16} className="text-rose-500" />
                Exportar PDF
              </button>
              <button type="button" className="flex-1 flex justify-center items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                <FileSpreadsheet size={16} className="text-emerald-500" />
                Exportar Excel
              </button>
            </div>
          </form>
        </div>

        {/* Recent Reports */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-6 border-b border-nexus-border dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reportes Recientes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {reports.map((report) => (
                <li key={report.id}>
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 group-hover:text-nexus-primary dark:group-hover:text-blue-400 group-hover:bg-nexus-primary/10 dark:group-hover:bg-blue-400/10 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 line-clamp-1">{report.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{report.date}</span>
                          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full hidden sm:block"></span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{report.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 pl-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block whitespace-nowrap">{report.size}</span>
                      <button className="p-2 text-slate-400 hover:text-nexus-accent dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
