import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import SeasonScreen from './SeasonScreen'

beforeEach(() => {
  localStorage.setItem('apiario-locale', 'en')
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

function wrap(ui, theme = 'a') {
  localStorage.setItem('apiario-theme', theme)
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

const baseProps = {
  log: [],
  completedTaskIds: new Set(),
  onToggleTask: vi.fn(),
}

describe('Winter store guidance', () => {
  it('renders the banner during winter months', () => {
    const profile = { climateZone: 'central', experience: 0 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/Check winter stores/)).toBeInTheDocument()
  })

  it('shows 18-22 kg for northern zone', () => {
    const profile = { climateZone: 'northern', experience: 1 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/18–22 kg/)).toBeInTheDocument()
  })

  it('shows 15-20 kg for central zone', () => {
    const profile = { climateZone: 'central', experience: 1 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/15–20 kg/)).toBeInTheDocument()
  })

  it('shows 12-16 kg for mediterranean zone', () => {
    const profile = { climateZone: 'mediterranean', experience: 1 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/12–16 kg/)).toBeInTheDocument()
  })

  it('shows 12-15 kg for other zone', () => {
    const profile = { climateZone: 'other', experience: 1 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/12–15 kg/)).toBeInTheDocument()
  })

  it('shows beginner tip when experience is 0', () => {
    const profile = { climateZone: 'northern', experience: 0 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/As a beginner/)).toBeInTheDocument()
  })

  it('does not show beginner tip when experience is 1', () => {
    const profile = { climateZone: 'northern', experience: 1 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.queryByText(/As a beginner/)).not.toBeInTheDocument()
  })

  it('does not show winter guidance outside winter months', () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const profile = { climateZone: 'central', experience: 0 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.queryByText(/Check winter stores/)).not.toBeInTheDocument()
  })

  it('renders the banner in theme B', () => {
    const profile = { climateZone: 'mediterranean', experience: 0 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />, 'b')
    expect(screen.getByText(/12–16 kg/)).toBeInTheDocument()
  })

  it('renders the banner in theme C', () => {
    const profile = { climateZone: 'central', experience: 0 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />, 'c')
    expect(screen.getByText(/15–20 kg/)).toBeInTheDocument()
  })

  it('shows bilingual subtitle', () => {
    const profile = { climateZone: 'central', experience: 1 }
    wrap(<SeasonScreen profile={profile} {...baseProps} />)
    expect(screen.getByText(/bees consume stores through winter/)).toBeInTheDocument()
  })
})

describe('Next actions', () => {
  it('renders diagnosis warnings above the seasonal task list', () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const profile = {
      climateZone: 'central',
      experience: 1,
      colonies: [{ id: 'c1', name: 'Blue Hive' }],
    }
    const inspections = [
      { id: 'i1', colonyId: 'c1', date: '2026-04-01', queenStatus: 'not_seen' },
    ]

    wrap(<SeasonScreen profile={profile} inspections={inspections} {...baseProps} />)

    const nextAction = screen.getByText(/Possible issue in Blue Hive/i)
    const task = screen.getAllByText(/First hive inspection/i).at(-1)
    expect(nextAction.compareDocumentPosition(task) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText(/latest inspection did not confirm the queen/i)).toBeInTheDocument()
  })

  it('sends the selected action target to the app shell', () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const onNextAction = vi.fn()
    const profile = {
      climateZone: 'central',
      experience: 1,
      colonies: [{ id: 'c1', name: 'Blue Hive' }],
    }

    wrap(
      <SeasonScreen
        profile={profile}
        inspections={[{ id: 'i1', colonyId: 'c1', date: '2026-04-01', queenStatus: 'not_seen' }]}
        onNextAction={onNextAction}
        {...baseProps}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Possible issue in Blue Hive/i }))
    expect(onNextAction).toHaveBeenCalledWith({ tab: 'diagnose' })
  })

  it('shows the all-clear state when records are current and seasonal tasks are complete', () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const profile = {
      climateZone: 'central',
      experience: 1,
      colonies: [{ id: 'c1', name: 'Blue Hive' }],
    }
    const completedTaskIds = new Set(['sp-01', 'sp-02', 'sp-03', 'sp-04', 'sp-05', 'sp-secret-01', 'sp-secret-02'])

    wrap(
      <SeasonScreen
        profile={profile}
        inspections={[{ id: 'i1', colonyId: 'c1', date: '2026-04-14', queenStatus: 'seen' }]}
        {...baseProps}
        completedTaskIds={completedTaskIds}
      />
    )

    expect(screen.getByText(/No urgent next actions/i)).toBeInTheDocument()
    expect(screen.getByText(/Keep following the seasonal checklist/i)).toBeInTheDocument()
  })

  it('renders in Field Notebook and Seasonal Light themes', () => {
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
    const profile = { climateZone: 'central', experience: 1, colonies: [] }
    const { unmount } = wrap(<SeasonScreen profile={profile} inspections={[]} {...baseProps} />, 'b')
    expect(screen.getByText(/Add your first colony/i)).toBeInTheDocument()
    unmount()

    wrap(<SeasonScreen profile={profile} inspections={[]} {...baseProps} />, 'c')
    expect(screen.getByText(/Add your first colony/i)).toBeInTheDocument()
  })
})
