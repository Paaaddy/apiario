import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import BottomNav from './BottomNav'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('BottomNav', () => {
  it('renders all three tabs', () => {
    wrap(<BottomNav activeTab="season" onTabChange={() => {}} />)
    expect(screen.getByText('Season')).toBeInTheDocument()
    expect(screen.getByText('Diagnose')).toBeInTheDocument()
    expect(screen.getByText('My Hive')).toBeInTheDocument()
  })

  it('calls onTabChange with correct key when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    wrap(<BottomNav activeTab="season" onTabChange={onTabChange} />)
    await user.click(screen.getByText('Diagnose'))
    expect(onTabChange).toHaveBeenCalledWith('diagnose')
  })

  it('marks the active tab with honey colour class', () => {
    wrap(<BottomNav activeTab="diagnose" onTabChange={() => {}} />)
    const diagnoseBtn = screen.getByText('Diagnose').closest('button')
    expect(diagnoseBtn).toHaveClass('text-honey')
  })
})
