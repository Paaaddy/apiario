import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'

vi.mock('../data/diagnosis.json', () => ({
  default: {
    root: {
      type: 'question',
      question: { de: 'Was siehst du?', en: 'What are you seeing?' },
      options: [{ next: 'missing-node', label: { de: 'Option', en: 'Option' } }],
    },
  },
}))

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

describe('DiagnoseScreen — corrupted tree', () => {
  it('rejects broken content before navigation and offers localized feedback and a safe restart', async () => {
    const { default: DiagnoseScreen } = await import('./DiagnoseScreen')
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)

    expect(screen.queryByText(/what are you seeing/i)).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Diagnosis guidance is unavailable. Try restarting or return to another tab.')
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /start over/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'DE', exact: true }))
    expect(screen.getByRole('alert')).toHaveTextContent('Die Diagnosehinweise sind nicht verfügbar.')
  })
})
