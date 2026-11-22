import { act, configure, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import { UNDO_WINDOW_MS } from './hooks/useColonyRemoval'

configure({ asyncUtilTimeout: 5000 })

const PROFILE = {
  schemaVersion: 3, onboardingDone: true, climateZone: 'central', experience: 1,
  colonies: [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }],
}
const INSPECTIONS = [
  { id: 'i1', colonyId: 'a', date: '2026-04-10', queenStatus: 'seen' },
  { id: 'i2', colonyId: 'a', date: '2026-04-12', queenStatus: 'seen' },
  { id: 'i3', colonyId: 'b', date: '2026-04-11', queenStatus: 'seen' },
]

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 3, 15, 12))
  localStorage.setItem('apiario-locale', 'en')
  localStorage.setItem('apiario-profile', JSON.stringify(PROFILE))
  localStorage.setItem('apiario-inspections', JSON.stringify(INSPECTIONS))
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
})

// Opens My Hive, then fakes the timers: findBy* would hang on a faked
// setTimeout, so everything after this point is a synchronous query.
async function openColonies(locale = 'en') {
  localStorage.setItem('apiario-locale', locale)
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: locale === 'de' ? /Mein Stock/ : /My Hive/ }))
  await screen.findByRole('heading', { name: /Apple/ })
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  vi.setSystemTime(new Date(2026, 3, 15, 12))
}
const removeColony = (name) =>
  fireEvent.click(within(screen.getByRole('heading', { name: new RegExp(name) }).closest('li')).getByRole('button', { name: /^(Remove|Entfernen)$/ }))
const stored = () => [localStorage.getItem('apiario-profile'), localStorage.getItem('apiario-inspections')]

describe('Colony deletion undo (#193)', () => {
  it('hides the Colony at once, announces an undo notice, and Undo restores everything unchanged', async () => {
    await openColonies()
    const before = stored()
    removeColony('Apple')
    expect(screen.queryByRole('heading', { name: /Apple/ })).not.toBeInTheDocument()
    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('Colony “Apple” removed.')
    expect(stored()).toEqual(before)

    fireEvent.click(within(notice).getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('heading', { name: /Apple/ })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS * 2))
    expect(stored()).toEqual(before)
  })

  it('removes the Colony and its Inspections from storage when the window ends', async () => {
    await openColonies()
    removeColony('Apple')
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('apiario-profile')).colonies.map((colony) => colony.id)).toEqual(['b'])
    expect(JSON.parse(localStorage.getItem('apiario-inspections')).records.map((record) => record.id)).toEqual(['i3'])
  })

  it('two quick deletions: the first is committed, the second is the one Undo brings back', async () => {
    await openColonies()
    removeColony('Apple')
    removeColony('Birch')
    expect(JSON.parse(localStorage.getItem('apiario-profile')).colonies.map((colony) => colony.id)).toEqual(['b'])
    expect(screen.getByRole('status')).toHaveTextContent('Colony “Birch” removed.')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('heading', { name: /Birch/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Apple/ })).not.toBeInTheDocument()
  })

  it('names the notice and the action in German, with a 44px action', async () => {
    await openColonies('de')
    removeColony('Apple')
    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('Volk „Apple“ entfernt.')
    const undo = within(notice).getByRole('button', { name: 'Rückgängig' })
    expect(undo.className).toContain('min-h-11')
    expect(undo.className).toContain('min-w-11')
  })

  it('a Backup export commits an open deletion first, so the file matches the screen', async () => {
    await openColonies()
    const created = []
    URL.createObjectURL = vi.fn((blob) => { created.push(blob); return 'blob:x' })
    URL.revokeObjectURL = vi.fn()
    removeColony('Apple')
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }))
    fireEvent.click(screen.getByRole('button', { name: /Data & backup/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }))
    expect(JSON.parse(localStorage.getItem('apiario-profile')).colonies.map((colony) => colony.id)).toEqual(['b'])
    const text = await created[0].text()
    expect(text).not.toContain('"Apple"')
  })
})
