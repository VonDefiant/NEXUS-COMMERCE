import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { ShieldAlert, LogOut, Mail, Phone } from 'lucide-react';
import { Logo } from '../components/Logo';

export function LicenseBlockedPage() {
  const { t } = useTranslation();
  const { login, logout, user } = useAppStore();

  const getMessage = () => {
    switch (user?.license?.status) {
      case 'license_not_found':
        return 'Sin Licencia Activa';
      case 'license_tampered':
        return 'Licencia Comprometida';
      case 'license_expired':
        return 'Licencia Expirada';
      case 'license_suspended':
        return 'Licencia Suspendida';
      default:
        return 'Sin Licencia Activa';
    }
  };

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const pollLicenseStatus = async () => {
      try {
        const token = localStorage.getItem("nexus_session_token");
        if (token) {
          const res = await fetch('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.user && data.user.license?.status !== 'suspended') {
              // Si la licencia volvió a estar activa, actualizamos el estado
              login(data.user);
            }
          }
        }
      } catch (e) {
        // Ignorar errores de red
      }
      timeout = setTimeout(pollLicenseStatus, 5000);
    };

    timeout = setTimeout(pollLicenseStatus, 5000);
    return () => clearTimeout(timeout);
  }, [login]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-800 overflow-hidden text-center relative transition-colors">
        
        {/* Top Header / Branding */}
        <div className="bg-slate-100 dark:bg-slate-950/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-center">
          <Logo size="md" />
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-rose-100 dark:border-rose-500/20">
            <ShieldAlert size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {getMessage()}
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            El acceso al sistema operativo para <strong className="text-slate-700 dark:text-slate-300">{user?.businessName || 'esta cuenta'}</strong> ha sido pausado. Por favor, comunícate con el administrador de tu sistema o con el departamento de soporte de <strong className="text-nexus-primary dark:text-blue-400">Nexus Solutions</strong> para regularizar el estado de tu cuenta.
          </p>

          {/* Support Data Box */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 mb-8 border border-slate-100 dark:border-slate-800 text-left space-y-3">
             <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
               <span className="text-sm text-slate-500 dark:text-slate-400">Código de Licencia (PIN)</span>
               <span className="font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                 {user?.license?.supportPin || '----'}
               </span>
             </div>
             <a href="mailto:soporte@nexussolutions.com" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-nexus-primary transition-colors">
               <Mail size={16} className="text-slate-400" />
               soporte@nexussolutions.com
             </a>
             <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
               <Phone size={16} className="text-slate-400" />
               +1 (555) 123-4567
             </div>
          </div>

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut size={18} />
            {t('layout.logout')}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 dark:text-slate-600">
        &copy; {new Date().getFullYear()} Nexus Solutions. Todos los derechos reservados.
      </p>
    </div>
  );
}
