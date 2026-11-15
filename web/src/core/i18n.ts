import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../i18n/en.json'
import es from '../i18n/es.json'

let saved: string | null = null
try { saved = localStorage.getItem('lang') } catch { /* storage blocked */ }

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: saved === 'es' ? 'es' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (l) => {
  document.documentElement.lang = l
  try { localStorage.setItem('lang', l) } catch { /* ignore */ }
})
document.documentElement.lang = i18n.language

export default i18n
