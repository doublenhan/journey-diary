import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import './styles/datepicker.css';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AdminProvider } from './contexts/AdminContext';
//import './styles/SettingPage.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AdminProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AdminProvider>
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>
);
