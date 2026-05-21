import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Search,
  X,
  LogOut as LogOutIcon,
  AlertTriangle,
  Moon,
  Sun,
  MessageSquare,
  Globe
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FeedbackModal } from './FeedbackModal';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, theme, toggleTheme, language, setLanguage } = useAppStore();
  
  const activePath = location.pathname.substring(1); // removes the leading slash

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { path: 'dashboard', label: t('layout.dashboard'), icon: LayoutDashboard },
    { path: 'products', label: t('layout.products'), icon: Package },
    { path: 'sales', label: t('layout.sales'), icon: ShoppingCart },
    { path: 'reports', label: t('layout.reports'), icon: FileText },
  ];

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen w-full bg-nexus-surface dark:bg-slate-950 flex overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-nexus-border dark:border-slate-800 flex flex-col transition-all duration-300 z-50 md:relative flex-shrink-0 h-full",
          isMobile 
            ? (sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64") 
            : (sidebarOpen ? "translate-x-0 w-64" : "translate-x-0 w-20")
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-nexus-border dark:border-slate-800 flex-shrink-0">
          <Logo collapsed={!isMobile && !sidebarOpen} size="md" />
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-500 hover:bg-slate-100 rounded-md">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            const showLabel = isMobile || sidebarOpen;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                  isActive 
                    ? "bg-nexus-primary dark:bg-slate-800 text-white" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-nexus-primary dark:hover:text-white"
                )}
                title={!showLabel ? item.label : undefined}
              >
                <Icon size={20} className={cn("flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-nexus-primary")} />
                {showLabel && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {isActive && showLabel && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-nexus-accent rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-nexus-border dark:border-slate-800 flex-shrink-0">
          <button 
            onClick={() => setShowFeedback(true)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg transition-colors group relative",
              "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-nexus-primary dark:hover:text-white",
              (!isMobile && !sidebarOpen) && "justify-center"
            )}
            title={(!isMobile && !sidebarOpen) ? t('layout.help') : undefined}
          >
            <MessageSquare size={20} className="flex-shrink-0 text-slate-500 group-hover:text-nexus-primary dark:group-hover:text-white transition-colors" />
            {(isMobile || sidebarOpen) && <span className="font-medium text-sm">{t('layout.help')}</span>}
          </button>

          <button 
            onClick={() => handleNavigate('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 mb-4 rounded-lg transition-colors group relative",
              activePath === 'settings' 
                ? "bg-nexus-primary dark:bg-slate-800 text-white" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-nexus-primary dark:hover:text-white",
              (!isMobile && !sidebarOpen) && "justify-center"
            )}
            title={(!isMobile && !sidebarOpen) ? t('layout.settings') : undefined}
          >
            <Settings size={20} className={cn("flex-shrink-0", activePath === 'settings' ? "text-white" : "text-slate-500 group-hover:text-nexus-primary")} />
            {(isMobile || sidebarOpen) && <span className="font-medium text-sm">{t('layout.settings')}</span>}
            {activePath === 'settings' && (isMobile || sidebarOpen) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-nexus-accent rounded-r-full" />
            )}
          </button>

          <div className={cn("flex items-center gap-3", (!isMobile && !sidebarOpen) && "justify-center")}>
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar de Usuario" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
               <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                 <span className="text-sm font-bold text-slate-500 dark:text-slate-300">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                 </span>
               </div>
            )}
            {(isMobile || sidebarOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              "mt-3 w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-900/20 hover:text-red-600 dark:hover:text-rose-400 transition-colors",
              (!isMobile && !sidebarOpen) && "justify-center"
            )}
            title={(!isMobile && !sidebarOpen) ? t('layout.logout') : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {(isMobile || sidebarOpen) && <span>{t('layout.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full h-full">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-nexus-border dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={t('layout.searchPlaceholder')} 
                className="pl-10 pr-4 py-2 w-64 lg:w-96 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            <button 
              onClick={toggleLanguage}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-nexus-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              title={t('layout.changeLanguage')}
            >
              <Globe size={20} />
              <span className="text-xs font-bold font-mono tracking-wider hidden sm:inline-block">{language.toUpperCase()}</span>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Search size={20} />
            </button>
            
            <button className="p-2 relative text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            {/* Business Info and Logo Upload */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col items-end justify-center">
                <span className="text-[15px] font-bold text-nexus-primary dark:text-white leading-tight">{user?.businessName || 'Empresa'}</span>
                <span className="text-[13px] text-slate-500 dark:text-slate-400">Guatemala, GT</span>
              </div>
              
              <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => handleNavigate('settings')}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-nexus-primary text-white font-bold text-[14px] shadow-sm tracking-wide overflow-hidden border border-nexus-border">
                  {user?.businessLogo ? (
                    <img src={user.businessLogo} alt="Logo de empresa" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.businessName?.substring(0, 2).toUpperCase() || 'EM'}</span>
                  )}
                </div>
                {/* Overlay pointing to settings */}
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Settings size={14} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Modals */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/50 border border-transparent dark:border-slate-800 w-full max-w-sm overflow-hidden relative z-10 transition-colors"
            >
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <LogOutIcon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('layout.logoutConfirmTitle')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {t('layout.logoutConfirmText')}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex gap-3 transition-colors">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('layout.cancel')}
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 border border-transparent text-white font-medium text-sm rounded-lg hover:bg-rose-700 transition-colors"
                >
                  {t('layout.yesLogout')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
