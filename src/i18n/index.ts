import { createI18n } from 'vue-i18n'
import es from './locales/es.json'
import en from './locales/en.json'

export type Locale = 'es' | 'en'

const STORAGE_KEY = 'bb-chief-locale'

function getInitialLocale(): Locale {
  try {
    const savedLocale = localStorage.getItem(STORAGE_KEY)

    if (savedLocale === 'es' || savedLocale === 'en') {
      return savedLocale
    }
  } catch {
    // Si localStorage no está disponible, usamos español.
  }

  return 'es'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'es',
  messages: {
    es,
    en,
  },
})

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale

  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // El idioma seguirá activo durante la sesión actual.
  }
}
