import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import DiagnosisResult from './DiagnosisResult'

const originalShare = globalThis.navigator.share
const originalClipboard = globalThis.navigator.clipboard

beforeEach(() => {
  localStorage.setItem('apiario-locale', 'en')
})
afterEach(() => {
  localStorage.clear()
  globalThis.navigator.share = originalShare
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: originalClipboard,
    writable: true,
    configurable: true,
  })
})

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

const sampleNode = {
  type: 'outcome',
  diagnosis: { de: 'Weisellos', en: 'Queenless' },
  actions: [
    { de: 'Prüfe auf Weiselzellen.', en: 'Check for queen cells.' },
    { de: 'Beim Verein nach einer Königin fragen.', en: 'Ask your association for a queen.' },
  ],
  callExpert: true,
}

describe('DiagnosisResult', () => {
  it('renders the diagnosis name and action list', () => {
    wrap(<DiagnosisResult node={sampleNode} onReset={() => {}} />)
    expect(screen.getByRole('heading', { name: /queenless/i })).toBeInTheDocument()
    expect(screen.getByText(/check for queen cells/i)).toBeInTheDocument()
    expect(screen.getByText(/ask your association/i)).toBeInTheDocument()
  })

  it('renders the "Contact a beekeeping expert" callout when callExpert is true', () => {
    wrap(<DiagnosisResult node={sampleNode} onReset={() => {}} />)
    expect(screen.getByText(/contact a beekeeping expert/i)).toBeInTheDocument()
  })

  it('calls navigator.share on the Share button, with the diagnosis and actions', async () => {
    const user = userEvent.setup()
    const share = vi.fn(() => Promise.resolve())
    globalThis.navigator.share = share
    wrap(<DiagnosisResult node={sampleNode} onReset={() => {}} />)
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(share).toHaveBeenCalled()
    const payload = share.mock.calls[0][0]
    expect(payload.text).toContain('Queenless')
    expect(payload.text).toContain('Check for queen cells.')
    expect(payload.text).toContain('Ask your association for a queen.')
  })

  it('falls back to clipboard and shows "Copied" when navigator.share is missing', async () => {
    const user = userEvent.setup()
    delete globalThis.navigator.share
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })
    wrap(<DiagnosisResult node={sampleNode} onReset={() => {}} />)
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalled()
    // The button re-labels itself to "Copied" for a short feedback window.
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument()
  })

  it('calls onReset when the Start over button is clicked', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    wrap(<DiagnosisResult node={sampleNode} onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: /start over/i }))
    expect(onReset).toHaveBeenCalled()
  })
})
