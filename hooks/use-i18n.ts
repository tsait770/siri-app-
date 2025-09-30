import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import ar from '@/l10n/ar.json';
import de from '@/l10n/de.json';
import en from '@/l10n/en.json';
import es from '@/l10n/es.json';
import fr from '@/l10n/fr.json';
import ja from '@/l10n/ja.json';
import ko from '@/l10n/ko.json';
import pt from '@/l10n/pt.json';
import ptBR from '@/l10n/pt-BR.json';
import ru from '@/l10n/ru.json';
import zhCN from '@/l10n/zh-CN.json';
import zhTW from '@/l10n/zh-TW.json';

export type Language = 'en' | 'zh-TW' | 'zh-CN' | 'es' | 'pt-BR' | 'pt' | 'de' | 'fr' | 'ru' | 'ar' | 'ja' | 'ko';

type TranslationTree = Record<string, any>;

const translations: Record<Language, TranslationTree> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  es,
  'pt-BR': ptBR,
  pt,
  de,
  fr,
  ru,
  ar,
  ja,
  ko,
};

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt-BR', name: 'Brazilian Portuguese', nativeName: 'Português (Brasil)' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

function getNested(obj: TranslationTree, path: string[]): any {
  return path.reduce((acc, key) => (acc?.[key] ?? undefined), obj);
}

export const [I18nProvider, useI18n] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('language');
      if (stored && translations[stored as Language]) {
        setLanguage(stored as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = getNested(translations[language], keys);

    if (typeof value !== 'string') {
      value = getNested(translations.en, keys);
    }

    if (typeof value !== 'string') {
      console.warn(`Missing translation for key: ${key} (lang: ${language})`);
      value = key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue ?? ''));
      });
    }

    return value;
  };

  return {
    language,
    changeLanguage,
    t,
    isLoading,
    languages,
  };
});