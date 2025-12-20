import { createContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, DEFAULT_LANGUAGE } from '../config/languages';
import { vi } from '../translations/vi';
import { en } from '../translations/en';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserLanguage, saveUserLanguage } from '../apis/userLanguageApi';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  // Listen to auth state and load language from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Load language preference from Firebase
        try {
          const savedLanguage = await getUserLanguage(user.uid);
          if (savedLanguage) {
            setCurrentLanguage(savedLanguage);
            localStorage.setItem('userLanguage', savedLanguage);
          }
        } catch (error) {
          console.error('Failed to load language preference:', error);
        }
      } else {
        setUserId(null);
      }
      setIsLanguageLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  // Save to Firebase when language changes (if user is logged in)
  useEffect(() => {
    if (isLanguageLoaded && userId && currentLanguage) {
      localStorage.setItem('userLanguage', currentLanguage);
      
      // Save to Firebase
      saveUserLanguage(userId, currentLanguage).catch((error) => {
        console.error('Failed to save language preference:', error);
      });
    }
  }, [currentLanguage, userId, isLanguageLoaded]);

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
