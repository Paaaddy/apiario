import { renderHook, act } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { useLanguage } from './useLanguage'

function wrapper({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>
}

beforeEach(() => {
  localStorage.clear()
})

describe('useLanguage', () => {
  it('defaults to de', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.locale).toBe('de')
  })

  it('t() returns plain string unchanged', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.t('hello')).toBe('hello')
  })

  it('t() returns empty string for null/undefined', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.t(null)).toBe('')
    expect(result.current.t(undefined)).toBe('')
  })

  it('t() resolves de branch by default', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.t({ de: 'Hallo', en: 'Hello' })).toBe('Hallo')
  })

  it('t() resolves en branch after setLocale("en")', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    act(() => result.current.setLocale('en'))
    expect(result.current.t({ de: 'Hallo', en: 'Hello' })).toBe('Hello')
  })

  it('persists locale to localStorage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    act(() => result.current.setLocale('en'))
    expect(localStorage.getItem('apiario-locale')).toBe('en')
  })

  it('reads locale from localStorage on mount', () => {
    localStorage.setItem('apiario-locale', 'en')
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.locale).toBe('en')
  })

  it('t() returns empty string for object missing both de and en', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.t({})).toBe('')
  })
})
