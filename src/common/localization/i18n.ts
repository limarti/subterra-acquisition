import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import languages from './locales/languages.json';

const i18n = createI18n({
  legacy: false,
  locale: languages.default,
  fallbackLocale: languages.default,
  messages: {
    en,
    es
  }
});

export const setLocale = (locale: string): void =>
{
  i18n.global.locale.value = locale as typeof i18n.global.locale.value;
};

export default i18n;
