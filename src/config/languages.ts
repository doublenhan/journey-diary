export type LanguageCode = 'vi' | 'en';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dateLocale: string;
}

export const LANGUAGES: Record<LanguageCode, Language> = {
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    dateLocale: 'vi-VN'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dateLocale: 'en-US'
  }
};

export const DEFAULT_LANGUAGE: LanguageCode = 'vi';
