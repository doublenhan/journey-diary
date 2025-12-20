import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback for cases where hook is called outside provider
    console.warn('useLanguage called outside LanguageProvider, using fallback');
    return {
      currentLanguage: 'vi' as const,
      setLanguage: () => {},
      t: (key: string) => key,
      dateLocale: 'vi-VN'
    };
  }
  return context;
}
