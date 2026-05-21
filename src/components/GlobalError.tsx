import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export function GlobalError({ error, resetError }: { error: Error | any; resetError: () => void }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Ups! Algo salió mal</h1>
        <p className="text-sm text-slate-500 mb-6">
          Ha ocurrido un error inesperado al cargar esta pantalla. Nuestro equipo técnico ya ha sido notificado.
        </p>
        
        {/* Only show technical details in development or early stages */}
        <div className="bg-slate-100 rounded-lg p-4 text-left overflow-auto max-h-32 mb-6">
          <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">
            {error.message || "Error desconocido"}
          </p>
        </div>

        <button 
          onClick={resetError}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 px-4 rounded-xl font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCcw size={18} />
          Intentar recargar
        </button>
      </div>
    </div>
  );
}
