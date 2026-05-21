import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { authClient } from '../lib/auth-client';
import { Save, Upload, User, Building2, Shield, Lock, CreditCard, ExternalLink, Activity, Cloud, Calendar, ShieldCheck, Server, Download } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateBusiness, updateProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'security' | 'billing'>('profile');
  
  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  
  // Business State
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessLogo, setBusinessLogo] = useState(user?.businessLogo || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          reject(new Error("No canvas context"));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await resizeImage(file, 256);
        setProfileAvatar(compressedDataUrl);
      } catch (err) {
        toast.error("Error al procesar la imagen");
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      try {
        const compressedDataUrl = await resizeImage(file, 512);
        setBusinessLogo(compressedDataUrl);
      } catch (err) {
        toast.error("Error al procesar la imagen");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'profile') {
        const { error } = await authClient.updateUser({
          image: profileAvatar,
          name: profileName
        });
        if (error) {
           toast.error("Error al actualizar el perfil: " + error.message);
        } else {
           updateProfile(profileName, profileEmail, profileAvatar);
           toast.success(t('settings.profile.success'));
        }
      } else if (activeTab === 'business') {
        if (isAdmin) {
          updateBusiness(businessName, businessLogo);
          toast.success(t('settings.business.success'));
        } else {
          toast.error(t('settings.business.noPermission'));
        }
      } else if (activeTab === 'security') {
        toast.success(t('settings.security.success'));
      }
    } catch (err: any) {
       toast.error("Error inesperado: " + err.message);
    } finally {
       setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Settings Navigation Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'bg-nexus-primary text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User size={18} />
            {t('settings.tabs.profile')}
          </button>
          
          <button
            onClick={() => setActiveTab('business')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
              activeTab === 'business' 
                ? 'bg-nexus-primary text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 size={18} />
            {t('settings.tabs.business')}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
              activeTab === 'security' 
                ? 'bg-nexus-primary text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield size={18} />
            {t('settings.tabs.security')}
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
              activeTab === 'billing' 
                ? 'bg-nexus-primary text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard size={18} />
            {t('settings.tabs.billing')}
          </button>


        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl border border-nexus-border dark:border-slate-800 p-6 shadow-sm transition-colors">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{t('settings.profile.title')}</h3>
              
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Foto de Perfil</label>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden flex-shrink-0">
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-slate-400">
                          {profileName ? profileName.substring(0, 2).toUpperCase() : 'US'}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <Upload size={16} />
                        <span>Subir nueva imagen</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Recomendado 256x256 pídeles formato PNG o JPEG.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.profile.fullName')}</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.profile.email')}</label>
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS TAB */}
          {activeTab === 'business' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('settings.business.title')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('settings.business.subtitle')}</p>
              
              {!isAdmin && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
                  <Lock size={20} className="flex-shrink-0" />
                  <p className="text-sm font-medium">{t('settings.business.readOnlyWarning')}</p>
                </div>
              )}

              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('settings.business.logoLabel')}</label>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden flex-shrink-0">
                      {businessLogo ? (
                        <img src={businessLogo} alt="Business Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-slate-400">
                          {businessName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors ${isAdmin ? 'cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700' : 'cursor-not-allowed text-slate-400 dark:text-slate-500 opacity-60'}`}>
                        <Upload size={16} />
                        <span>{t('settings.business.uploadNew')}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={!isAdmin} />
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('settings.business.uploadHint')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.business.nameLabel')}</label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t('settings.business.namePlaceholder')}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all text-sm outline-none placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB (Mock) */}
          {activeTab === 'security' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{t('settings.security.title')}</h3>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.security.currentPass')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('settings.security.newPass')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-nexus-accent/50 focus:border-nexus-accent transition-all text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BILLING / LICENSE TAB */}
          {activeTab === 'billing' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('settings.billing.title')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('settings.billing.subtitle')}</p>
              
              {!isAdmin ? (
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex gap-3 text-slate-600 dark:text-slate-400">
                  <Lock size={20} className="flex-shrink-0" />
                  <p className="text-sm font-medium">{t('settings.billing.readOnlyWarning')}</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {/* Current Plan Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Server size={140} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Activity size={12} />
                          {t('settings.billing.statusActive')}
                        </span>
                        <span className="text-slate-300 text-sm">{t('settings.billing.currentPlan')}</span>
                      </div>
                      <h4 className="text-3xl font-black mb-8">{user?.license?.planName}</h4>
                      
                      <div className="space-y-4 max-w-sm">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Cloud size={18} />
                            <span className="text-sm">{t('settings.billing.licenseType')}</span>
                          </div>
                          <span className="font-semibold text-sm">{t('settings.billing.typeCloud')}</span>
                        </div>
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Calendar size={18} />
                            <span className="text-sm">{t('settings.billing.validUntil')}</span>
                          </div>
                          <span className="font-semibold text-sm">
                            {user?.license?.validUntil
                              ? (() => {
                                  const d = new Date(user.license.validUntil);
                                  return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
                                    .toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
                                })()
                              : 'Sin datos'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2 text-slate-300">
                            <ShieldCheck size={18} />
                            <span className="text-sm">{t('settings.billing.supportPin')}</span>
                          </div>
                          <span className="font-mono text-sm tracking-widest text-nexus-accent bg-nexus-accent/10 px-2 py-0.5 rounded border border-nexus-accent/20">
                            {user?.license?.supportPin || '----'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Shared Action Bottom Bar */}
          {activeTab !== 'billing' && (
            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
              <button 
                onClick={handleSave}
                disabled={isSaving || (activeTab === 'business' && !isAdmin)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-nexus-primary text-white text-sm font-medium rounded-lg hover:bg-nexus-secondary hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nexus-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-nexus-primary"
              >
                <Save size={16} />
                {isSaving ? t('settings.saving') : t('settings.save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
