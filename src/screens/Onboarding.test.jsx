import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from './Onboarding'

describe('Onboarding', () => {
  it('shows step 1 (hive count) first', () => {
    render(<Onboarding onComplete={() => {}} />)
    expect(screen.getByText(/how many hives/i)).toBeInTheDocument()
  })

  it('advances to step 2 after selecting hive count', async () => {
    const user = userEvent.setup()
    render(<Onboarding onComplete={() => {}} />)
    await user.click(screen.getByText('1 hive'))
    expect(screen.getByText(/where are you located/i)).toBeInTheDocument()
  })

  it('advances to step 3 after selecting climate zone', async () => {
    const user = userEvent.setup()
    render(<Onboarding onComplete={() => {}} />)
    await user.click(screen.getByText('1 hive'))
    await user.click(screen.getByText('Central Europe'))
    expect(screen.getByText(/how long have you been/i)).toBeInTheDocument()
  })

  it('calls onComplete with profile data after step 3', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Onboarding onComplete={onComplete} />)
    await user.click(screen.getByText('1 hive'))
    await user.click(screen.getByText('Central Europe'))
    await user.click(screen.getByText('First year'))
    expect(onComplete).toHaveBeenCalledWith({
      hiveCount: 1,
      climateZone: 'central',
      experience: 0,
    })
  })
})
