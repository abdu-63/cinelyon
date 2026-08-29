// src/i18n/I18nContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import fr from './translations/fr.json';
import en from './translations/en.json';
import es from './translations/es.json';
import it from './translations/it.json';
import de from './translations/de.json';
import pt from './translations/pt.json';
import ja from './translations/ja.json';
import ar from './translations/ar.json';
import tr from './translations/tr.json';

export type SupportedLocale = 'fr' | 'en' | 'es' | 'it' | 'de' | 'pt' | 'ja' | 'ar' | 'tr';

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italien', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Allemand', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portugais', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: 'Japonais', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabe', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Turc', nativeName: 'Türkçe', flag: '🇹🇷' },
];

const TRANSLATIONS: Record<SupportedLocale, Record<string, unknown>> = {
  fr,
  en,
  es,
  it,
  de,
  pt,
  ja,
  ar,
  tr,
};

const STORAGE_KEY = 'cinelyon_user_language';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  languages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key: string) => key,
  isRTL: false,
  languages: SUPPORTED_LANGUAGES,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('fr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in TRANSLATIONS) {
        setLocaleState(saved as SupportedLocale);
      } else if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.slice(0, 2).toLowerCase();
        if (browserLang in TRANSLATIONS) {
          setLocaleState(browserLang as SupportedLocale);
        }
      }
    } catch {
      // Ignorer si localStorage inaccessible
    }
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    try {
      setLocaleState(newLocale);
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    } catch {
      // Ignorer
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let currentVal: unknown = TRANSLATIONS[locale];
      let fallbackVal: unknown = TRANSLATIONS.fr;

      for (const k of keys) {
        if (currentVal && typeof currentVal === 'object' && k in currentVal) {
          currentVal = (currentVal as Record<string, unknown>)[k];
        } else {
          currentVal = undefined;
        }

        if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackVal) {
          fallbackVal = (fallbackVal as Record<string, unknown>)[k];
        } else {
          fallbackVal = undefined;
        }
      }

      let res = typeof currentVal === 'string' ? currentVal : typeof fallbackVal === 'string' ? fallbackVal : key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          res = res.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
        });
      }

      return res;
    },
    [locale]
  );

  const isRTL = locale === 'ar';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
