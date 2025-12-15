import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import './styles/datepicker.css';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';

// Build verification - MUST appear in console
console.log('🚀 APP STARTING - Build: 2025-12-15-v2');
console.log('📦 If this log appears, new build is loaded');
console.log('⚠️ If Firebase errors appear, CHECK firebaseConfig.ts');

//import './styles/SettingPage.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>
);
