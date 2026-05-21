import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-400 dark:text-slate-500 transition-colors">
        <SearchX size={48} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">404 - Página no encontrada</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido movida, eliminada o el enlace sea incorrecto.
      </p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-6 py-2.5 bg-nexus-primary text-white text-sm font-medium rounded-lg hover:bg-nexus-secondary hover:-translate-y-0.5 transition-all shadow-sm"
      >
        <ArrowLeft size={16} />
        Volver al Panel Principal
      </button>
    </div>
  );
}
