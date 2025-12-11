import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import './styles/datepicker.css';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { initPerformanceMonitoring } from './utils/performance';
import { initPWA } from './utils/serviceWorker';
import { OfflineDetector } from './components/OfflineDetector';

// Initialize performance monitoring in production
if (process.env.NODE_ENV === 'production') {
  initPerformanceMonitoring();
}

// Initialize PWA (service worker + install prompt) - works in both dev and production
// Firebase offline persistence handles data sync, SW only caches static assets
initPWA().catch(console.error);

const Root = () => {
  return (
    <>
      <OfflineDetector />
      <App />
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>
);
