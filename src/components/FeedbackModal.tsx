import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, Bug, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'suggestion'>('bug');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    
    // Simulate Network Request and Sentry Hook
    setTimeout(() => {
      // 1. Send to Sentry (Invisible to user but you will see it in the panel)
      Sentry.captureMessage(`[${type.toUpperCase()}] ${message}`, {
        level: type === 'bug' ? 'error' : 'info',
        tags: { 
          feature: "feedback_modal",
          feedback_type: type 
        }
      });
      
      // 2. Clear state and show UI Toast
      toast.success("¡Gracias! Tu reporte ha sido enviado al equipo.", {
        icon: '🚀'
      });
      setIsSubmitting(false);
      setMessage('');
      onClose();
    }, 1200); // 1.2s delay for illusion of processing
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl border border-transparent dark:border-slate-800 w-full max-w-md overflow-hidden relative z-10 transition-colors"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-nexus-accent" />
                Reportar un Problema
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    type === 'bug' 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                      : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bug size={24} />
                  <span className="text-sm font-medium">Error</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('suggestion')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    type === 'suggestion' 
                      ? 'border-nexus-accent bg-blue-50 dark:bg-blue-500/10 text-nexus-accent dark:text-blue-400' 
                      : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Lightbulb size={24} />
                  <span className="text-sm font-medium">Sugerencia</span>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  ¿Qué encontraste o qué podemos mejorar?
                </label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={type === 'bug' ? "Describe el error que experimentaste..." : "Describe tu increíble idea aquí..."}
                  className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all text-sm outline-none resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-nexus-primary text-white font-medium text-sm rounded-lg hover:bg-nexus-secondary dark:hover:bg-nexus-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
