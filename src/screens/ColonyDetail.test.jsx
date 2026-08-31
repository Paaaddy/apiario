import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import ColonyDetail from './ColonyDetail'

beforeEach(() => {
  localStorage.setItem('apiario-locale', 'en')
})
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

const colony = { id: 'col-1', name: 'Apple Tree', notes: '', createdAt: '2026-01-01' }

const inspections = [
  { id: 'i1', colonyId: 'col-1', date: '2026-05-01', queenStatus: 'seen', varroa: 2, broodPattern: 3, population: 4, honeyStores: 3, harvest: 5 },
  { id: 'i2', colonyId: 'col-1', date: '2026-06-01', queenStatus: 'seen', varroa: 4, broodPattern: 4, population: 4, honeyStores: 3, harvest: 7.5 },
  { id: 'i3', colonyId: 'col-2', date: '2026-06-05', queenStatus: 'seen', varroa: 1, broodPattern: 2, population: 3, honeyStores: 2, harvest: 3 },
]

describe('ColonyDetail', () => {
  it('sums harvest and counts inspections for the selected colony only', () => {
    wrap(<ColonyDetail colony={colony} inspections={inspections} onBack={vi.fn()} />)
    expect(screen.getByText('12.5 kg')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows the empty-history message when the colony has no inspections', () => {
    wrap(<ColonyDetail colony={{ id: 'col-9', name: 'Empty Hive' }} inspections={inspections} onBack={vi.fn()} />)
    expect(screen.getByText(/no inspections for this colony yet/i)).toBeInTheDocument()
    expect(screen.getByText('0.0 kg')).toBeInTheDocument()
  })

  it('shows "not enough data" for a sparkline with fewer than 2 points', () => {
    const single = [inspections[0]]
    wrap(<ColonyDetail colony={colony} inspections={single} onBack={vi.fn()} />)
    expect(screen.getAllByText('Not enough data').length).toBeGreaterThan(0)
  })

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn()
    wrap(<ColonyDetail colony={colony} inspections={inspections} onBack={onBack} />)
    fireEvent.click(screen.getByText('←'))
    expect(onBack).toHaveBeenCalled()
  })

  it('opens the edit form and saves via onUpdateInspection', () => {
    const onUpdateInspection = vi.fn()
    wrap(
      <ColonyDetail
        colony={colony}
        inspections={inspections}
        colonies={[colony]}
        onBack={vi.fn()}
        onUpdateInspection={onUpdateInspection}
      />
    )
    fireEvent.click(screen.getByLabelText(/2026-05-01/))
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit inspection')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Save'))
    expect(onUpdateInspection).toHaveBeenCalledWith('i1', expect.objectContaining({ date: '2026-05-01' }))
  })

  it('deletes an inspection via onDeleteInspection after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onDeleteInspection = vi.fn()
    wrap(
      <ColonyDetail
        colony={colony}
        inspections={inspections}
        onBack={vi.fn()}
        onDeleteInspection={onDeleteInspection}
      />
    )
    fireEvent.click(screen.getByLabelText(/2026-05-01/))
    fireEvent.click(screen.getByText('Delete'))
    expect(onDeleteInspection).toHaveBeenCalledWith('i1')
  })
})
