import { createContext, useState, useEffect } from 'react'

const VALID_THEMES = ['a', 'b', 'c']

function sanitizeTheme(raw) {
  return VALID_THEMES.includes(raw) ? raw : 'a'
}

export const ThemeContext = createContext({ theme: 'a', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => sanitizeTheme(localStorage.getItem('apiario-theme') ?? 'a')
  )

  function setTheme(t) {
    const safe = sanitizeTheme(t)
    setThemeState(safe)
    try {
      localStorage.setItem('apiario-theme', safe)
    } catch {}
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Set immediately to avoid flash of wrong theme on mount
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
