import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createMMKV } from 'react-native-mmkv';

import en from '../locales/en.json';
import fr from '../locales/fr.json';

const storage = createMMKV();
const LANGUAGE_KEY = 'user-language';

const resources = {
  en: { translation: en },
  fr: { translation: fr }
};

const getStoredLanguage = () => {
  const storedLanguage = storage.getString(LANGUAGE_KEY);
  return storedLanguage || 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  storage.set(LANGUAGE_KEY, lng);
};

export default i18n;
