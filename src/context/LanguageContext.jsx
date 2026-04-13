import { createContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'apiario-locale'

function loadLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'de'
  } catch {
    return 'de'
  }
}

export const LanguageContext = createContext({
  locale: 'de',
  setLocale: () => {},
  t: (v) => (typeof v === 'string' ? v : v?.de ?? ''),
})

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(loadLocale)

  const setLocale = useCallback((lang) => {
    setLocaleState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {}
  }, [])

  const t = useCallback(
    (value) => {
      if (value == null) return ''
      if (typeof value === 'string') return value
      return value[locale] ?? value.de ?? ''
    },
    [locale]
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
