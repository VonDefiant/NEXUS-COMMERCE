import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors", className)}>
      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 transition-colors">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:-translate-y-0.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
