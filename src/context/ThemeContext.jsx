import { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext({ theme: 'a', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('apiario-theme') ?? 'a'
  )

  function setTheme(t) {
    setThemeState(t)
    localStorage.setItem('apiario-theme', t)
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
