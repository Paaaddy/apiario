import { act, configure, fireEvent, render, screen, within, cleanup } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

configure({ asyncUtilTimeout: 5000 })

function seed(date = '2026-04-05', climateZone = 'central') {
  localStorage.setItem('apiario-locale', 'en')
  localStorage.setItem('apiario-profile', JSON.stringify({
    schemaVersion: 3, onboardingDone: true, climateZone,
    experience: 1, hiveCount: 1, colonies: [{ id: 'a', name: 'Apple' }],
  }))
  localStorage.setItem('apiario-inspections', JSON.stringify([
    { id: 'apple', colonyId: 'a', date, queenStatus: 'seen', varroa: 0, broodPattern: 4 },
  ]))
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  vi.setSystemTime(new Date(2026, 3, 15, 23, 59, 59))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

async function openSeason() {
  // Settle lazy imports and React before advancing the midnight clock.
  await import('./screens/SeasonScreen')
  await act(async () => { render(<App />) })
  expect(screen.getByRole('region', { name: 'Next actions' })).toBeInTheDocument()
}

async function findWeek(text) {
  const result = screen.findByText(text)
  // Testing Library schedules its successful waitFor completion on a timeout.
  // Flush it without moving the simulated calendar day.
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
  return result
}

describe('Current-date colony guidance', () => {
  it('refreshes overdue guidance at local midnight without another interaction', async () => {
    seed()
    await openSeason()
    expect(screen.queryByRole('button', { name: /Inspect Apple/ })).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(screen.getByRole('button', { name: /Inspect Apple/ })).toHaveTextContent('Last inspection was 11 days ago.')
    await act(async () => { await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000) })
    expect(screen.getByRole('button', { name: /Inspect Apple/ })).toHaveTextContent('Last inspection was 12 days ago.')
  }, 15000)

  it('catches up after suspension when the document becomes visible', async () => {
    seed()
    await openSeason()
    let visibility = 'hidden'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    // A suspended browser can return days later without running its timeout.
    vi.setSystemTime(new Date(2026, 3, 18, 8))
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.queryByRole('button', { name: /Inspect Apple/ })).not.toBeInTheDocument()
    visibility = 'visible'
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.getByRole('button', { name: /Inspect Apple/ })).toHaveTextContent('Last inspection was 13 days ago.')
  }, 15000)

  it('keeps colony age and its current seasonal threshold while browsing winter tasks', async () => {
    seed('2026-04-01')
    await openSeason()
    for (let i = 0; i < 7; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))
    const actions = screen.getByRole('region', { name: 'Next actions' })
    expect(within(actions).getByRole('button', { name: /Inspect Apple/ })).toHaveTextContent('Last inspection was 14 days ago.')
    expect(within(actions).getByRole('button', { name: /Apply oxalic acid treatment/ })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Heft the hive weekly' })).toBeInTheDocument()
  }, 15000)

  it.each(['following', 'browsing'])('keeps the %s week intent across a Sunday midnight rollover', async (intent) => {
    vi.setSystemTime(new Date(2026, 3, 19, 23, 59, 59))
    seed('2026-04-19')
    await openSeason()
    if (intent === 'browsing') {
      fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))
      expect(await findWeek('6 Apr – 12 Apr')).toBeInTheDocument()
    } else {
      expect(await findWeek('13 Apr – 19 Apr')).toBeInTheDocument()
    }
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(await findWeek(intent === 'browsing' ? '6 Apr – 12 Apr' : '20 Apr – 26 Apr')).toBeInTheDocument()
    if (intent === 'browsing') {
      fireEvent.click(screen.getByRole('button', { name: 'Jump to this week' }))
      expect(await findWeek('20 Apr – 26 Apr')).toBeInTheDocument()
      await act(async () => { await vi.advanceTimersByTimeAsync(7 * 24 * 60 * 60 * 1000) })
      expect(await findWeek('27 Apr – 3 May')).toBeInTheDocument()
    }
  }, 15000)

  it('does not invent overdue age by browsing future weeks for a freshly inspected Colony', async () => {
    seed('2026-04-15')
    await openSeason()
    for (let i = 0; i < 9; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(await findWeek('15 Jun – 21 Jun')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inspect Apple/ })).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Next actions' })).queryByText(/days ago/)).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(await findWeek('15 Jun – 21 Jun')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inspect Apple/ })).not.toBeInTheDocument()
  }, 15000)

  it('uses the current climate-adjusted season rather than a browsed spring threshold', async () => {
    vi.setSystemTime(new Date(2026, 2, 10, 12))
    seed('2026-02-23', 'northern')
    await openSeason()
    // Northern guidance is still in winter on this date (15 days is not overdue).
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByRole('group', { name: 'First hive inspection' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inspect Apple/ })).not.toBeInTheDocument()
  }, 15000)

  it('refreshes current-season guidance on foreground while leaving an explicitly browsed week selected', async () => {
    vi.setSystemTime(new Date(2026, 10, 30, 12))
    seed('2026-11-15')
    await openSeason()
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(await findWeek('23 Nov – 29 Nov')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inspect Apple/ })).toHaveTextContent('Last inspection was 15 days ago.')
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    vi.setSystemTime(new Date(2026, 11, 1, 8))
    fireEvent(document, new Event('visibilitychange'))
    // Winter's 30-day threshold now applies, not the displayed autumn's 14 days.
    expect(screen.queryByRole('button', { name: /Inspect Apple/ })).not.toBeInTheDocument()
    expect(await findWeek('23 Nov – 29 Nov')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Treat for varroa mites' })).toBeInTheDocument()
  }, 15000)
})
