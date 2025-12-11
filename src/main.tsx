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

// Initialize performance monitoring and PWA only in production
if (process.env.NODE_ENV === 'production') {
  initPerformanceMonitoring();
  // Initialize PWA (service worker + install prompt)
  initPWA().catch(console.error);
} else {
  console.log('🔧 Development mode - Service Worker disabled');
  // Unregister any existing service workers in dev
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🗑️  Unregistered service worker for dev mode');
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>
);
