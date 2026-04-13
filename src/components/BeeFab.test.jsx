import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import BeeFab from './BeeFab'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('BeeFab', () => {
  it('renders the bee button', () => {
    wrap(<BeeFab onActivate={() => {}} isActive={false} />)
    expect(screen.getByRole('button', { name: /bee hands-free mode/i })).toBeInTheDocument()
  })

  it('calls onActivate when clicked', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    wrap(<BeeFab onActivate={onActivate} isActive={false} />)
    await user.click(screen.getByRole('button', { name: /bee hands-free mode/i }))
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('applies pulse-glow animation when active', () => {
    wrap(<BeeFab onActivate={() => {}} isActive={true} />)
    const btn = screen.getByRole('button', { name: /bee hands-free mode/i })
    expect(btn).toHaveClass('animate-pulse-glow')
  })

  it('applies bob animation when inactive', () => {
    wrap(<BeeFab onActivate={() => {}} isActive={false} />)
    const btn = screen.getByRole('button', { name: /bee hands-free mode/i })
    expect(btn).toHaveClass('animate-bob')
  })
})
