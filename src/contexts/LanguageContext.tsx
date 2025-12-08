import { createContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, DEFAULT_LANGUAGE } from '../config/languages';
import { vi } from '../translations/vi';
import { en } from '../translations/en';

const translations = { vi, en };

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  dateLocale: string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('userLanguage');
    return (saved === 'vi' || saved === 'en') ? saved : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem('userLanguage', currentLanguage);
  }, [currentLanguage]);

  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: any = translations[currentLanguage];
      
      for (const k of keys) {
        value = value?.[k];
        if (!value) {
          console.warn(`Translation key not found: ${key}`);
          return key; // Fallback to key if not found
        }
      }
      
      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key; // Fallback to key on error
    }
  };

  const dateLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      setLanguage: setCurrentLanguage, 
      t,
      dateLocale 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}
