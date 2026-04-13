import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BottomNav from './BottomNav'

describe('BottomNav', () => {
  it('renders all three tabs', () => {
    render(<BottomNav activeTab="season" onTabChange={() => {}} />)
    expect(screen.getByText('Season')).toBeInTheDocument()
    expect(screen.getByText('Diagnose')).toBeInTheDocument()
    expect(screen.getByText('My Hive')).toBeInTheDocument()
  })

  it('calls onTabChange with correct key when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(<BottomNav activeTab="season" onTabChange={onTabChange} />)
    await user.click(screen.getByText('Diagnose'))
    expect(onTabChange).toHaveBeenCalledWith('diagnose')
  })

  it('marks the active tab with honey colour class', () => {
    render(<BottomNav activeTab="diagnose" onTabChange={() => {}} />)
    const diagnoseBtn = screen.getByText('Diagnose').closest('button')
    expect(diagnoseBtn).toHaveClass('text-honey')
  })
})
