import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import React from 'react';
import en from '@/translations/en.json';
import ur from '@/translations/ur.json';
import sd from '@/translations/sd.json';

export type Language = 'en' | 'ur' | 'sd';

type TranslationMap = Record<string, any>;

const translations: Record<Language, TranslationMap> = { en, ur, sd };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  /** Like t() but returns React nodes with English words bidi-isolated for RTL languages */
  tr: (key: string) => React.ReactNode;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): string => {
  const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
  return typeof value === 'string' ? value : path;
};

/** Wraps English/number words in <bdi dir="ltr"> for proper RTL rendering */
const isolateEnglish = (text: string, isRTL: boolean): React.ReactNode => {
  if (!isRTL) return text;
  const parts = text.split(/([A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (/^[A-Za-z0-9]/.test(part)) {
      return React.createElement('bdi', { key: i, dir: 'ltr', style: { unicodeBidi: 'isolate' } }, part);
    }
    return React.createElement(React.Fragment, { key: i }, part);
  });
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'en'
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const isRTL = language === 'ur' || language === 'sd';

  const t = useCallback((key: string): string => {
    return getNestedValue(translations[language], key);
  }, [language]);

  const tr = useCallback((key: string): React.ReactNode => {
    const text = getNestedValue(translations[language], key);
    return isolateEnglish(text, isRTL);
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
