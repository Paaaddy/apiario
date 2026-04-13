import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BeeFab from './BeeFab'

describe('BeeFab', () => {
  it('renders the bee button', () => {
    render(<BeeFab onActivate={() => {}} isActive={false} />)
    expect(screen.getByRole('button', { name: /bee hands-free mode/i })).toBeInTheDocument()
  })

  it('calls onActivate when clicked', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    render(<BeeFab onActivate={onActivate} isActive={false} />)
    await user.click(screen.getByRole('button', { name: /bee hands-free mode/i }))
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('applies pulse-glow animation when active', () => {
    render(<BeeFab onActivate={() => {}} isActive={true} />)
    const btn = screen.getByRole('button', { name: /bee hands-free mode/i })
    expect(btn).toHaveClass('animate-pulse-glow')
  })

  it('applies bob animation when inactive', () => {
    render(<BeeFab onActivate={() => {}} isActive={false} />)
    const btn = screen.getByRole('button', { name: /bee hands-free mode/i })
    expect(btn).toHaveClass('animate-bob')
  })
})
