import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import ThemeSwitcher from './ThemeSwitcher'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(theme = 'a') {
  localStorage.setItem('apiario-theme', theme)
  return render(<ThemeProvider><LanguageProvider><ThemeSwitcher /></LanguageProvider></ThemeProvider>)
}

describe('ThemeSwitcher', () => {
  it('renders all three theme buttons', () => {
    wrap('a')
    expect(screen.getByText('Honeycomb')).toBeInTheDocument()
    expect(screen.getByText('Field Notebook')).toBeInTheDocument()
    expect(screen.getByText('Seasonal Light')).toBeInTheDocument()
  })

  it('active button has amber background in theme A', () => {
    wrap('a')
    const btn = screen.getByText('Honeycomb').closest('button')
    // jsdom normalizes hex to rgb
    expect(btn.style.background).toBe('rgb(245, 166, 35)')
  })

  it('inactive buttons have white background in theme A', () => {
    wrap('a')
    const btn = screen.getByText('Field Notebook').closest('button')
    expect(btn.style.background).toBe('rgb(255, 255, 255)')
  })

  it('active button has dark background in theme B', () => {
    wrap('b')
    const btn = screen.getByText('Field Notebook').closest('button')
    expect(btn.style.background).toBe('rgb(43, 29, 14)')
  })

  it('active button has frosted-glass background in theme C', () => {
    wrap('c')
    const btn = screen.getByText('Seasonal Light').closest('button')
    expect(btn.style.background).toBe('rgba(255, 255, 255, 0.6)')
  })

  it('inactive button has transparent background in theme C', () => {
    wrap('c')
    const btn = screen.getByText('Honeycomb').closest('button')
    expect(btn.style.background).toBe('transparent')
  })
})
