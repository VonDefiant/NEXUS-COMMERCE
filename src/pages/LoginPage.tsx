import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { authClient } from '../lib/auth-client';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordEmailSent, setForgotPasswordEmailSent] = useState(false);
  const login = useAppStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isForgotPasswordMode) {
      try {
        // Usamos requestPasswordReset nativo de better-auth 1.0+ en sustitución de forgetPassword
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) {
           toast.error(error.message || "Error al solicitar restablecer la contraseña");
        } else {
           setForgotPasswordEmailSent(true);
           toast.success("Correo enviado (revisa tu bandeja de entrada o spam)");
        }
      } catch (err: any) {
        toast.error("Error inesperado al enviar el correo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      // 1. Sign In via Better Auth
      const { data: authData, error: authError } = await authClient.signIn.email({
        email,
        password
      });

      if (authError) {
        toast.error("Credenciales incorrectas o error en el servidor");
        setIsLoading(false);
        return;
      }

      // 2. Fetch enriched user data from our backend
      const token = localStorage.getItem("nexus_session_token") || authData?.token || authData?.session?.token;
      
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!res.ok) {
        // Obtenemos los detalles si falló para debugear
        const errorText = await res.text();
        throw new Error(`Error BD API: ${errorText}`);
      }
      
      const data = await res.json();
      
      // 3. Authenticate in global state
      login(data.user);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexus-surface dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nexus-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-nexus-accent/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-nexus-border dark:border-slate-800 p-6 sm:p-8 relative z-10 transition-colors">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
             {isForgotPasswordMode ? 'Recuperar contraseña' : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
             {isForgotPasswordMode 
               ? 'Te enviaremos un enlace seguro para restablecer tu acceso'
               : 'Ingresa tus credenciales para acceder al panel'
             }
          </p>
        </div>

        {isForgotPasswordMode && forgotPasswordEmailSent ? (
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
             <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">¡Correo enviado!</h3>
             <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                Si tu correo existe en nuestros registros, recibirás un enlace de recuperación pronto.
             </p>
             <button 
                onClick={() => { setIsForgotPasswordMode(false); setForgotPasswordEmailSent(false); }}
                className="text-sm font-medium text-nexus-accent hover:underline"
             >
                Volver al inicio de sesión
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-colors text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="admin@nexus.com"
                />
              </div>
            </div>

            {!isForgotPasswordMode && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                  <button type="button" onClick={() => setIsForgotPasswordMode(true)} className="text-xs font-medium text-nexus-accent dark:text-blue-400 hover:text-nexus-primary dark:hover:text-blue-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
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
            )}

            {!isForgotPasswordMode && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-nexus-accent focus:ring-nexus-accent border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                  Recordarme por 30 días
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-nexus-primary hover:bg-nexus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nexus-primary transition-colors group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isForgotPasswordMode ? 'Enviar enlace' : 'Iniciar Sesión'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {isForgotPasswordMode && (
               <div className="text-center mt-4">
                  <button type="button" onClick={() => setIsForgotPasswordMode(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                     Volver a Iniciar Sesión
                  </button>
               </div>
            )}
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Portal de acceso empresarial seguro. <br/>
            &copy; {new Date().getFullYear()} Nexus Soluciones.
          </p>
        </div>
      </div>
    </div>
  );
}
