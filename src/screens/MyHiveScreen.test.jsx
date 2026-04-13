import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyHiveScreen from './MyHiveScreen'

const profile = { hiveCount: 2, climateZone: 'central', experience: 1, onboardingDone: true }

describe('MyHiveScreen', () => {
  it('renders the My Hive heading', () => {
    render(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    expect(screen.getByText(/my hive/i)).toBeInTheDocument()
  })

  it('highlights the current hive count option', () => {
    render(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    const btn = screen.getByText('2–3 hives')
    expect(btn).toHaveClass('bg-honey')
  })

  it('calls onUpdate with new hiveCount when a different option is clicked', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<MyHiveScreen profile={profile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('1 hive'))
    expect(onUpdate).toHaveBeenCalledWith({ hiveCount: 1 })
  })

  it('calls onUpdate with new experience when changed', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<MyHiveScreen profile={profile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('First year'))
    expect(onUpdate).toHaveBeenCalledWith({ experience: 0 })
  })
})
