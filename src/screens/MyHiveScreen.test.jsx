import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import MyHiveScreen from './MyHiveScreen'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

const profile = { hiveCount: 2, climateZone: 'central', experience: 1, onboardingDone: true }

describe('MyHiveScreen', () => {
  it('renders the My Hive heading', () => {
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    expect(screen.getByText(/my hive/i)).toBeInTheDocument()
  })

  it('renders the tab strip', () => {
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    expect(screen.getByRole('button', { name: /^colonies$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^inspections$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^profile$/i })).toBeInTheDocument()
  })

  it('highlights the current hive count option on profile tab', async () => {
    const user = userEvent.setup()
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} />)
    await user.click(screen.getByRole('button', { name: /profile/i }))
    const btn = screen.getByText('2–3 hives')
    expect(btn).toHaveClass('bg-honey')
  })

  it('calls onUpdate with new hiveCount when a different option is clicked', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<MyHiveScreen profile={profile} onUpdate={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /profile/i }))
    await user.click(screen.getByText('1 hive'))
    expect(onUpdate).toHaveBeenCalledWith({ hiveCount: 1 })
  })

  it('calls onUpdate with new experience when changed', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<MyHiveScreen profile={profile} onUpdate={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /profile/i }))
    await user.click(screen.getByText('First year'))
    expect(onUpdate).toHaveBeenCalledWith({ experience: 0 })
  })

  it('shows empty log message when no entries', async () => {
    const user = userEvent.setup()
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} log={[]} />)
    await user.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('shows task log entry on log tab', async () => {
    const user = userEvent.setup()
    const log = [{
      id: 'task-sp-01-123',
      type: 'task',
      taskId: 'sp-01',
      taskName: { de: 'Frühjahrskontrolle', en: 'Spring inspection' },
      completedAt: '2026-04-13',
    }]
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} log={log} />)
    await user.click(screen.getByRole('button', { name: /^log$/i }))
    expect(screen.getByText(/Spring inspection/)).toBeInTheDocument()
  })

  it('opens custom entry form when button clicked on log tab', async () => {
    const user = userEvent.setup()
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} log={[]} />)
    await user.click(screen.getByRole('button', { name: /^log$/i }))
    await user.click(screen.getByText('+ Custom entry'))
    expect(screen.getByPlaceholderText(/what did you do/i)).toBeInTheDocument()
  })

  it('renders the Colonies section with the profile colonies', () => {
    const profileWithColonies = {
      ...profile,
      colonies: [
        { id: 'col-1', name: 'Apple tree', createdAt: '2026-03-01', notes: '' },
      ],
    }
    wrap(<MyHiveScreen profile={profileWithColonies} onUpdate={() => {}} />)
    expect(screen.getByText(/your colonies/i)).toBeInTheDocument()
    expect(screen.getByText(/🐝 Apple tree/)).toBeInTheDocument()
  })

  it('forwards onAddColony / onUpdateColony / onRemoveColony through', async () => {
    const user = userEvent.setup()
    const onAddColony = vi.fn()
    wrap(
      <MyHiveScreen
        profile={{ ...profile, colonies: [] }}
        onUpdate={() => {}}
        onAddColony={onAddColony}
        onUpdateColony={() => {}}
        onRemoveColony={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.type(screen.getByPlaceholderText(/colony name/i), 'Cherry')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onAddColony).toHaveBeenCalledWith('Cherry', '')
  })

  it('shows inspections tab content when inspections tab clicked', async () => {
    const user = userEvent.setup()
    wrap(<MyHiveScreen profile={profile} onUpdate={() => {}} inspections={[]} />)
    await user.click(screen.getByRole('button', { name: /inspections/i }))
    expect(screen.getByText(/no inspections yet/i)).toBeInTheDocument()
  })
})
