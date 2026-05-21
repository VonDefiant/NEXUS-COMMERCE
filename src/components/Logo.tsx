import React from 'react';
import { cn } from '../lib/utils';
import logoIcon from '../assets/logo.svg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  collapsed?: boolean;
}

export function Logo({ className, size = 'md', collapsed = false }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex-shrink-0 flex items-center justify-center", sizeClasses[size])}>
        <img 
          src={logoIcon} 
          alt="Nexus Logo" 
          className="absolute inset-0 w-full h-full object-contain dark:brightness-0 dark:invert transition-all duration-300" 
        />
      </div>
      
      {!collapsed && (
        <div className="flex flex-col justify-center mt-0.5">
          <span className={cn("font-bold tracking-[0.08em] text-nexus-primary dark:text-white leading-none uppercase", textClasses[size])}>
            NEXUS
          </span>
          <span className="text-nexus-primary dark:text-slate-400 font-semibold text-[0.45em] tracking-[0.35em] uppercase leading-none mt-1.5 pl-0.5 transition-colors">
            SOLUTIONS
          </span>
        </div>
      )}
    </div>
  );
}
