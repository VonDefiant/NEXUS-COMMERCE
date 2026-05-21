/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { SalesPage } from './pages/SalesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SuspendedPage } from './pages/SuspendedPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { useAppStore } from './store/useAppStore';
import { PageWrapper } from './components/PageWrapper';

export default function App() {
  const { isAuthenticated, user, theme, language } = useAppStore();
  const location = useLocation();
  const { i18n } = useTranslation();

  // Handle dark mode class injection to support Tailwind "dark:" variant
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Synchronize i18next language with Zustand store
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  if (!isAuthenticated) {
    return (
      <>
        <Routes>
           <Route path="/reset-password" element={<ResetPasswordPage />} />
           <Route path="*" element={<LoginPage />} />
        </Routes>
        <Toaster theme={theme} position="top-right" richColors />
      </>
    );
  }

  // License Hard-Stop Guard
  if (user?.license?.status === 'suspended') {
    return (
      <>
        <SuspendedPage />
        <Toaster theme={theme} position="top-right" richColors />
      </>
    );
  }

  return (
    <>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
            <Route path="/products" element={<PageWrapper><ProductsPage /></PageWrapper>} />
            <Route path="/sales" element={<PageWrapper><SalesPage /></PageWrapper>} />
            <Route path="/reports" element={<PageWrapper><ReportsPage /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
            <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </Layout>
      <Toaster theme={theme} position="top-right" richColors />
    </>
  );
}
