import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-xhr-backend';
import languageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  });

export default i18n;
