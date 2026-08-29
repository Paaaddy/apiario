import { createContext } from 'react'

// The context object lives in its own module (no components), so the provider
// file can export only the `LanguageProvider` component — satisfying the
// `react-refresh/only-export-components` rule and keeping Fast Refresh clean.
export const LanguageContext = createContext({
  locale: 'de',
  setLocale: () => {},
  t: (v) => (typeof v === 'string' ? v : v?.de ?? ''),
})
