import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): string => {
  const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
  return typeof value === 'string' ? value : path;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'en'
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Set document direction for RTL languages
    document.documentElement.dir = (lang === 'ur' || lang === 'sd') ? 'rtl' : 'ltr';
  };

  const t = useCallback((key: string): string => {
    return getNestedValue(translations[language], key);
  }, [language]);

  const dir = (language === 'ur' || language === 'sd') ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
