import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es';
import en from './locales/en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: 'es', // default language
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
