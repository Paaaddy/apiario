import { act, configure, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

configure({ asyncUtilTimeout: 5000 })

const colonies = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }]
const healthy = { queenStatus: 'seen', varroa: 0, broodPattern: 4 }

function seed(inspections, theme = 'a', locale = 'en') {
  localStorage.setItem('apiario-locale', locale)
  localStorage.setItem('apiario-theme', theme)
  localStorage.setItem('apiario-profile', JSON.stringify({
    schemaVersion: 3, onboardingDone: true, climateZone: 'central',
    experience: 1, hiveCount: 2, colonies,
  }))
  localStorage.setItem('apiario-inspections', JSON.stringify(inspections))
}

function navigate(name) {
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 3, 15, 12))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  delete document.startViewTransition
  delete HTMLElement.prototype.scrollIntoView
  localStorage.clear()
})

describe('Hosting migration', () => {
  it.each(['a', 'b', 'c'])('keeps the old app and data accessible with migration instructions in theme %s', async (theme) => {
    vi.stubEnv('VITE_LEGACY_HOST', 'true')
    seed([], theme)
    const savedProfile = localStorage.getItem('apiario-profile')
    render(<App />)
    const notice = await screen.findByRole('region', { name: 'Moving to Cloudflare Pages' })
    expect(notice).toHaveTextContent('My Hive → Profile → Data & backup')
    expect(notice).toHaveTextContent('do not move automatically')
    expect(within(notice).getByRole('link')).toHaveAttribute('href', 'https://apiario.pages.dev/')
    navigate(/My Hive/)
    expect(await screen.findByRole('heading', { name: /Apple/ })).toBeInTheDocument()
    expect(localStorage.getItem('apiario-profile')).toBe(savedProfile)
    fireEvent.click(screen.getByRole('button', { name: 'DE', exact: true }))
    expect(await screen.findByRole('region', { name: 'Umzug zu Cloudflare Pages' })).toHaveTextContent('Meine Bienen → Profil → Daten & Backup')
  })

  it('does not show the legacy notice on the new deployment', async () => {
    vi.stubEnv('VITE_LEGACY_HOST', '')
    seed([])
    render(<App />)
    await screen.findByRole('navigation')
    expect(screen.queryByRole('region', { name: 'Moving to Cloudflare Pages' })).not.toBeInTheDocument()
  })

  it('shows migration instructions before onboarding too', async () => {
    vi.stubEnv('VITE_LEGACY_HOST', 'true')
    localStorage.setItem('apiario-locale', 'en')
    render(<App />)
    expect(await screen.findByRole('region', { name: 'Moving to Cloudflare Pages' })).toHaveTextContent('reinstall')
  })
})

describe('Next action destinations', () => {
  it('does not call existing undated history a first Inspection', async () => {
    seed([{ id: 'birch', colonyId: 'b', date: '2026-02-30', ...healthy }])
    const profile = JSON.parse(localStorage.getItem('apiario-profile'))
    localStorage.setItem('apiario-profile', JSON.stringify({ ...profile, colonies: [colonies[1]] }))
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Record a dated inspection for Birch/ }))
    await screen.findByRole('dialog', { name: 'New inspection' })
    expect(screen.getByLabelText('Colony')).toHaveValue('b')
  }, 15000)

  it('keeps a multiple-Colony Inspection action on the listing', async () => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-01', ...healthy },
      { id: 'birch', colonyId: 'b', date: '2026-04-01', ...healthy },
    ])
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Inspect 2 colonies/ }))
    await screen.findByRole('heading', { name: /Apple/ })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }, 15000)

  it('does not revisit a consumed seasonal handoff when the displayed week changes', async () => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-14', ...healthy },
      { id: 'birch', colonyId: 'b', date: '2026-04-14', ...healthy },
    ])
    const scroll = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
    render(<App />)
    const actions = await screen.findByRole('region', { name: 'Next actions' })
    fireEvent.click(within(actions).getByRole('button', { name: /First hive inspection/ }))
    for (let i = 0; i < 9; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'First hive inspection' })).not.toBeInTheDocument()
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('apiario-log')).toBeNull()
  }, 15000)

  it('briefly reports a task that disappears before its handoff without changing the displayed week', async () => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-14', ...healthy },
      { id: 'birch', colonyId: 'b', date: '2026-04-14', ...healthy },
    ])
    render(<App />)
    const actions = await screen.findByRole('region', { name: 'Next actions' })
    let pending
    document.startViewTransition = (update) => { pending = update }
    fireEvent.click(within(actions).getByRole('button', { name: /First hive inspection/ }))
    for (let i = 0; i < 9; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    act(() => pending())
    expect(screen.getByRole('status')).toHaveTextContent('The selected colony or task is no longer available.')
    expect(screen.queryByRole('group', { name: 'First hive inspection' })).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(localStorage.getItem('apiario-log')).toBeNull()
  }, 15000)

  it('saves a new Inspection for the selected Colony, using a local default and allowing future dates', async () => {
    vi.setSystemTime(new Date(2026, 3, 15, 0, 15))
    const inspections = [
      { id: 'apple', colonyId: 'a', date: '2026-04-14', ...healthy },
      { id: 'birch', colonyId: 'b', date: '2026-04-01', ...healthy },
    ]
    seed(inspections)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Inspect Birch/ }))
    await screen.findByRole('dialog', { name: 'New inspection' })
    expect(screen.getByLabelText('Date')).toHaveValue('2026-04-15')
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-04-20' } })
    fireEvent.click(screen.getByRole('button', { name: /👑 Seen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
    expect(await screen.findByRole('button', { name: /2026-04-20 — expand/ })).toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem('apiario-inspections'))
    expect(saved).toHaveLength(3)
    expect(saved.find((inspection) => !['apple', 'birch'].includes(inspection.id))).toMatchObject({ colonyId: 'b', date: '2026-04-20', queenStatus: 'seen' })
    expect(saved.find((inspection) => inspection.id === 'birch')).toEqual(inspections[1])
  }, 15000)

  it.each(['resolved', 'removed'])('re-evaluates a selected warning that is %s before navigation without substituting another Colony', async (change) => {
    seed([
      { id: 'apple-old', colonyId: 'a', date: '2026-04-12', ...healthy },
      { id: 'apple', colonyId: 'a', date: '2026-04-13', ...healthy, queenStatus: 'not_seen' },
      { id: 'birch', colonyId: 'b', date: '2026-04-14', ...healthy, queenStatus: 'not_seen' },
    ])
    render(<App />)
    const action = await screen.findByRole('button', { name: /Possible issue in Apple/ })
    let pending
    document.startViewTransition = (update) => { if (!pending) pending = update; else update() }
    fireEvent.click(action)
    navigate(/^Inspect$/)
    fireEvent.click(await screen.findByRole('button', { name: /2026-04-13 — expand/ }))
    if (change === 'removed') {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }))
    } else {
      fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }))
      await screen.findByRole('dialog', { name: 'Edit inspection' })
      fireEvent.click(screen.getByRole('button', { name: /👑 Seen/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
    }
    act(() => pending())
    await screen.findByText('What are you seeing in or around the hive?')
    expect(screen.queryByRole('button', { name: /Start from last inspection/ })).not.toBeInTheDocument()
  }, 15000)

  it('shows a bilingual notice rather than diagnosing another Colony when a target is removed before navigation', async () => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-13', ...healthy, queenStatus: 'not_seen' },
      { id: 'birch', colonyId: 'b', date: '2026-04-14', ...healthy, queenStatus: 'not_seen' },
    ])
    render(<App />)
    const action = await screen.findByRole('button', { name: /Possible issue in Apple/ })
    let pending
    document.startViewTransition = (update) => {
      if (!pending) pending = update
      else update()
    }
    fireEvent.click(action)
    navigate(/My Hive/)
    const apple = (await screen.findByRole('heading', { name: /Apple/ })).closest('li')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(within(apple).getByRole('button', { name: 'Remove' }))
    act(() => pending())
    expect(await screen.findByRole('status')).toHaveTextContent('The selected colony or task is no longer available.')
    await screen.findByText('What are you seeing in or around the hive?')
    expect(screen.queryByRole('button', { name: /Start from last inspection/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'DE', exact: true }))
    expect(await screen.findByRole('status')).toHaveTextContent('Das gewählte Volk oder die Aufgabe ist nicht mehr verfügbar.')
  }, 15000)

  it('offers a dated Inspection for a Colony with only invalid dates without inventing a warning or age', async () => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-14', ...healthy },
      { id: 'birch', colonyId: 'b', date: { broken: true }, ...healthy, queenStatus: 'not_seen' },
    ])
    render(<App />)
    const actions = await screen.findByRole('region', { name: 'Next actions' })
    const action = within(actions).getByRole('button', { name: /Record a dated inspection for Birch/ })
    expect(within(actions).queryByText(/Possible issue in Birch/)).not.toBeInTheDocument()
    expect(within(actions).queryByText(/days ago/)).not.toBeInTheDocument()
    fireEvent.click(action)
    await screen.findByRole('heading', { name: 'New inspection' })
    expect(screen.getByLabelText('Colony')).toHaveValue('b')
  }, 15000)

  it.each(['a', 'b', 'c'])('focuses the seasonal task without completing it and repeats only explicit selection in theme %s', async (theme) => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-14', ...healthy },
      { id: 'birch', colonyId: 'b', date: '2026-04-14', ...healthy },
    ], theme)
    const scroll = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
    render(<App />)
    const actions = await screen.findByRole('region', { name: 'Next actions' })
    const action = within(actions).getByRole('button', { name: /First hive inspection/ })
    fireEvent.click(action)
    const task = await screen.findByRole('group', { name: 'First hive inspection' })
    expect(task).toHaveFocus()
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('apiario-log')).toBeNull()
    fireEvent.click(action)
    expect(task).toHaveFocus()
    expect(scroll).toHaveBeenCalledTimes(2)
    navigate(/Diagnose/)
    await screen.findByText('What are you seeing in or around the hive?')
    navigate(/Season/)
    await screen.findByRole('group', { name: 'First hive inspection' })
    expect(scroll).toHaveBeenCalledTimes(2)
  }, 15000)

  it('opens an unsaved new Inspection for the named Colony and consumes the handoff', async () => {
    const inspections = [
      { id: 'apple', colonyId: 'a', date: '2026-04-14', ...healthy },
      { id: 'birch', colonyId: 'b', date: '2026-04-01', ...healthy },
    ]
    seed(inspections)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Inspect Birch/ }))
    expect(await screen.findByRole('heading', { name: 'New inspection' })).toBeInTheDocument()
    expect(screen.getByLabelText('Colony')).toHaveValue('b')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(JSON.parse(localStorage.getItem('apiario-inspections'))).toEqual(inspections)
    navigate(/Season/)
    fireEvent.click(await screen.findByRole('button', { name: /Inspect Birch/ }))
    await screen.findByRole('heading', { name: 'New inspection' })
    navigate(/Season/)
    await screen.findByRole('button', { name: /Inspect Birch/ })
    navigate(/^Inspect$/)
    await screen.findByText(/Birch/)
    expect(screen.queryByRole('heading', { name: 'New inspection' })).not.toBeInTheDocument()
  }, 15000)

  it.each(['a', 'b', 'c'])('offers the selected Colony diagnosis, not a newer healthy Colony, in theme %s', async (theme) => {
    seed([
      { id: 'apple', colonyId: 'a', date: '2026-04-13', ...healthy, queenStatus: 'not_seen' },
      { id: 'birch', colonyId: 'b', date: '2026-04-14', ...healthy },
    ], theme)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Possible issue in Apple/ }))
    expect(await screen.findByText('What are you seeing in or around the hive?')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /Start from last inspection/ }))
    expect(await screen.findByText('Colony is queenless')).toBeInTheDocument()
    navigate(/Season/)
    await screen.findByRole('button', { name: /Possible issue in Apple/ })
    navigate(/Diagnose/)
    await screen.findByText('What are you seeing in or around the hive?')
    expect(screen.queryByRole('button', { name: /Start from last inspection/ })).not.toBeInTheDocument()
  }, 15000)
})
