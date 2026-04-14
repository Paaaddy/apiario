import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import VoicePermissionModal from './VoicePermissionModal'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('VoicePermissionModal', () => {
  it('renders the explanation and how-to', () => {
    wrap(<VoicePermissionModal onRetry={() => {}} onDismiss={() => {}} />)
    expect(screen.getByRole('dialog', { name: /microphone blocked/i })).toBeInTheDocument()
    expect(screen.getByText(/hands-free mode needs access to your microphone/i)).toBeInTheDocument()
    expect(screen.getByText(/lock or microphone icon/i)).toBeInTheDocument()
  })

  it('calls onRetry when "Try again" is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    wrap(<VoicePermissionModal onRetry={onRetry} onDismiss={() => {}} />)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when the Close button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    wrap(<VoicePermissionModal onRetry={() => {}} onDismiss={onDismiss} />)
    // Close text button (not the ✕ icon, which shares the same aria-label)
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    await user.click(closeButtons[closeButtons.length - 1])
    expect(onDismiss).toHaveBeenCalled()
  })
})
