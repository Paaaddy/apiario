import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider } from '../context/ThemeContext'
import { useTheme } from './useTheme'

function wrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

describe('useTheme', () => {
  it('defaults to theme "a"', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('a')
  })

  it('setTheme persists to localStorage and updates data-theme attribute', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme('b'))
    expect(result.current.theme).toBe('b')
    expect(localStorage.getItem('apiario-theme')).toBe('b')
    expect(document.documentElement.getAttribute('data-theme')).toBe('b')
  })

  it('invalid theme value is sanitised to "a"', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme('x'))
    expect(result.current.theme).toBe('a')
  })

  it('loads theme from existing localStorage value on mount', () => {
    localStorage.setItem('apiario-theme', 'c')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('c')
  })
})
