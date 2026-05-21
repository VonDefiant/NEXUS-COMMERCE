import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
       toast.error('La contraseña debe tener al menos 8 caracteres');
       return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        toast.error(error.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
      } else {
        setIsSuccess(true);
        toast.success('Contraseña actualizada correctamente');
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err: any) {
      toast.error('Error inesperado de red o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
     return (
        <div className="min-h-screen bg-nexus-surface dark:bg-slate-950 flex items-center justify-center p-4">
           <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-nexus-border dark:border-slate-800 p-6 sm:p-8 text-center text-slate-800 dark:text-slate-200">
               <h2 className="text-xl font-bold mb-4 text-red-500">Enlace inválido</h2>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">El enlace de recuperación no es válido o no contiene un token.</p>
               <button onClick={() => navigate('/')} className="text-sm font-medium text-nexus-accent hover:underline">Volver a inicio de sesión</button>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-nexus-surface dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nexus-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-nexus-accent/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-nexus-border dark:border-slate-800 p-6 sm:p-8 relative z-10 transition-colors">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nueva contraseña</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">Ingresa tu nueva contraseña para acceder</p>
        </div>

        {isSuccess ? (
           <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
             <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">¡Completado!</h3>
             <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                Tu contraseña ha sido restablecida correctamente.
             </p>
             <button 
                onClick={() => navigate('/')}
                className="w-full py-2 bg-nexus-primary text-white rounded-lg hover:bg-nexus-secondary transition-colors text-sm font-medium"
             >
                Ir a iniciar sesión
             </button>
          </div>
        ) : (
           <form onSubmit={handleSubmit} className="space-y-5">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nueva contraseña</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-slate-400" />
                 </div>
                 <input
                   type="password"
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-colors text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                   placeholder="••••••••"
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirmar contraseña</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-slate-400" />
                 </div>
                 <input
                   type="password"
                   required
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-colors text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                   placeholder="••••••••"
                 />
               </div>
             </div>

             <button
               type="submit"
               disabled={isLoading}
               className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-nexus-primary hover:bg-nexus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nexus-primary transition-colors group disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isLoading ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <>
                   Restablecer contraseña
                   <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                 </>
               )}
             </button>
             
             <div className="text-center mt-4">
                  <button type="button" onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                     Volver a Iniciar Sesión
                  </button>
               </div>
           </form>
        )}
      </div>
    </div>
  );
}
