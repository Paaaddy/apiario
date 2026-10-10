import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from '../context/ThemeContext'
import { LanguageProvider } from '../context/LanguageContext'
import VoiceNotice from './VoiceNotice'

afterEach(() => localStorage.clear())
it.each(['a', 'b', 'c'])('offers bilingual explicit restart/dismiss without restarting on render in theme %s', (theme) => {
  localStorage.setItem('apiario-theme', theme)
  localStorage.setItem('apiario-locale', 'de')
  const restart = vi.fn(), dismiss = vi.fn()
  render(<ThemeProvider><LanguageProvider><VoiceNotice feedback="ended" onRestart={restart} onDismiss={dismiss} /></LanguageProvider></ThemeProvider>)
  expect(screen.getByRole('status')).toHaveTextContent('Das Mikrofon hört nicht mehr zu')
  expect(restart).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Freisprechmodus erneut starten' }))
  expect(restart).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Schließen' }))
  expect(dismiss).toHaveBeenCalledOnce()
})

it.each([
  ['unsupported', 'This browser does not support speech recognition'],
  ['error', 'Speech recognition failed'],
])('explains %s without obstructing manual interaction', (feedback, text) => {
  localStorage.setItem('apiario-locale', 'en')
  render(<LanguageProvider><VoiceNotice feedback={feedback} onRestart={vi.fn()} onDismiss={vi.fn()} /></LanguageProvider>)
  expect(screen.getByRole('status')).toHaveTextContent(text)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
