import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';
import './i18n';
import { GlobalError } from './components/GlobalError';

// Inicializamos Sentry en el Frontend
Sentry.init({
  // En producción real esto usará tu URL real de Sentry, desde las variables de entono de Vite
  dsn: import.meta.env.VITE_SENTRY_DSN_FRONTEND || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Trazas y Rendimiento
  tracesSampleRate: 1.0, 
  // Grabación de Sesiones: Si hay error grabamos el 100%, sino el 10% para no saturar memoria
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary 
      fallback={({ error, resetError }) => (
        <GlobalError error={error} resetError={resetError} />
      )}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
