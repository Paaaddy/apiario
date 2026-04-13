import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import MyHiveScreen from './MyHiveScreen'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

const profile = { hiveCount: 2, climateZone: 'central', experience: 1, onboardingDone: true }

describe('MyHiveScreen', () => {
  it('renders the My Hive heading', () => {
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    expect(screen.getByText(/my hive/i)).toBeInTheDocument()
  })

  it('highlights the current hive count option', () => {
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    const btn = screen.getByText('2–3 hives')
    expect(btn).toHaveClass('bg-honey')
  })

  it('calls onUpdate with new hiveCount when a different option is clicked', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<MyHiveScreen profile={profile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('1 hive'))
    expect(onUpdate).toHaveBeenCalledWith({ hiveCount: 1 })
  })

  it('calls onUpdate with new experience when changed', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<MyHiveScreen profile={profile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('First year'))
    expect(onUpdate).toHaveBeenCalledWith({ experience: 0 })
  })

  it('shows empty log message when no entries', () => {
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} log={[]} />)
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('shows task log entry', () => {
    const log = [{
      id: 'task-sp-01-123',
      type: 'task',
      taskId: 'sp-01',
      taskName: { de: 'Frühjahrskontrolle', en: 'Spring inspection' },
      completedAt: '2026-04-13',
    }]
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} log={log} />)
    expect(screen.getByText(/Spring inspection/)).toBeInTheDocument()
  })

  it('opens custom entry form when button clicked', async () => {
    const user = userEvent.setup()
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} log={[]} />)
    await user.click(screen.getByText('+ Custom entry'))
    expect(screen.getByPlaceholderText(/what did you do/i)).toBeInTheDocument()
  })
})
