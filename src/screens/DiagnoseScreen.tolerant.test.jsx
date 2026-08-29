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
  it('does not white-screen when navigation leads to a missing node', async () => {
    const { default: DiagnoseScreen } = await import('./DiagnoseScreen')
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)

    expect(screen.getByText(/what are you seeing/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /option/i }))

    // After clicking into a broken node the screen renders null (safe fallback)
    // rather than throwing. The root question is gone and nothing crashes.
    expect(screen.queryByText(/what are you seeing/i)).not.toBeInTheDocument()
  })
})
