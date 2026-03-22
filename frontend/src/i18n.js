import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    defaultNS: 'translation',
    ns: ['translation'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      // Check localStorage first, then browser preference
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tcms_lang',
    },
    interpolation: {
      escapeValue: false,
    },
    // Reload all keys immediately on language change — no stale keys
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  });

// Persist language on every change so ALL pages (including Login) see it
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('tcms_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
