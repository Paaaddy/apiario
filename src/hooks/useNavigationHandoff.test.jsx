import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import {
  NAV_TABS,
  isNavTab,
  initialTabFromLocation,
  isTargetUnavailable,
  useNavigationHandoff,
} from './useNavigationHandoff'

function Nav({ colonies = [], inspections = [] }) {
  const navigation = useNavigationHandoff({ colonies, inspections })
  return (
    <div>
      <span data-testid="tab">{navigation.activeTab}</span>
      <span data-testid="handoff">{JSON.stringify(navigation.handoff)}</span>
      <span data-testid="scope">
        {JSON.stringify({ inspections: navigation.handoffInspections, colonyId: navigation.handoffColonyId ?? null })}
      </span>
      {navigation.notice}
      <button type="button" data-testid="dispatch-task" onClick={() => navigation.dispatch({ tab: 'season', taskId: 'spring-feed' })} />
      <button type="button" data-testid="dispatch-colony" onClick={() => navigation.dispatch({ tab: 'diagnose', colonyId: 'a' })} />
      <button type="button" data-testid="dispatch-unknown" onClick={() => navigation.dispatch({ tab: 'somewhere-else' })} />
      <button type="button" data-testid="navigate-away" onClick={() => navigation.navigate('myhive')} />
      <button type="button" data-testid="report-available" onClick={() => navigation.reportTargetScope(['spring-feed'])} />
      <button type="button" data-testid="report-missing" onClick={() => navigation.reportTargetScope([])} />
    </div>
  )
}

function renderNav(props) {
  return render(<LanguageProvider><Nav {...props} /></LanguageProvider>)
}

const press = (testId) => act(() => { screen.getByTestId(testId).click() })

beforeEach(() => {
  localStorage.setItem('apiario-locale', 'en')
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('tab vocabulary', () => {
  it('is the single ordered list of destinations', () => {
    expect(NAV_TABS.map((tab) => tab.key)).toEqual(['season', 'diagnose', 'inspect', 'learn', 'myhive'])
  })

  it('names a bilingual label and an emoji for every destination', () => {
    for (const tab of NAV_TABS) {
      expect(tab.label).toEqual(expect.objectContaining({ de: expect.any(String), en: expect.any(String) }))
      expect(tab.emoji).toBeTruthy()
    }
  })

  it('accepts only its own keys', () => {
    expect(NAV_TABS.every((tab) => isNavTab(tab.key))).toBe(true)
    expect(isNavTab('settings')).toBe(false)
    expect(isNavTab(undefined)).toBe(false)
    expect(isNavTab(null)).toBe(false)
  })

  it('reads the ?tab= deep link and falls back to the season screen', () => {
    expect(initialTabFromLocation('?tab=learn')).toBe('learn')
    expect(initialTabFromLocation('?tab=myhive')).toBe('myhive')
    expect(initialTabFromLocation('?tab=secret')).toBe('season')
    expect(initialTabFromLocation('')).toBe('season')
  })
})

describe('target availability', () => {
  const colonies = [{ id: 'a' }, { id: 'b' }]

  it('reports a colony that was removed as unavailable', () => {
    expect(isTargetUnavailable({ tab: 'diagnose', colonyId: 'a' }, { colonies })).toBe(false)
    expect(isTargetUnavailable({ tab: 'diagnose', colonyId: 'gone' }, { colonies })).toBe(true)
  })

  it('reports a task that left the reported scope as unavailable', () => {
    expect(isTargetUnavailable({ tab: 'season', taskId: 'spring-feed' }, { taskIds: ['spring-feed'] })).toBe(false)
    expect(isTargetUnavailable({ tab: 'season', taskId: 'spring-feed' }, { taskIds: [] })).toBe(true)
  })

  it('does not judge a task before the screen reported a scope for the selection', () => {
    expect(isTargetUnavailable({ tab: 'season', taskId: 'spring-feed' }, {})).toBe(false)
    expect(isTargetUnavailable({ tab: 'season', taskId: 'spring-feed' }, { taskIds: null })).toBe(false)
  })

  it('never judges an idle handoff', () => {
    expect(isTargetUnavailable(null, { colonies, taskIds: [] })).toBe(false)
    expect(isTargetUnavailable(undefined, { colonies, taskIds: [] })).toBe(false)
  })
})

describe('useNavigationHandoff', () => {
  it('navigates to a dispatched target and stamps a monotonic selection id', () => {
    renderNav()
    press('dispatch-task')
    expect(screen.getByTestId('tab')).toHaveTextContent('season')
    expect(JSON.parse(screen.getByTestId('handoff').textContent)).toMatchObject({ tab: 'season', taskId: 'spring-feed', selectionId: 1 })

    press('dispatch-colony')
    expect(screen.getByTestId('tab')).toHaveTextContent('diagnose')
    expect(JSON.parse(screen.getByTestId('handoff').textContent)).toMatchObject({ tab: 'diagnose', colonyId: 'a', selectionId: 2 })
  })

  it('ignores a target outside the vocabulary', () => {
    renderNav()
    press('dispatch-unknown')
    expect(screen.getByTestId('tab')).toHaveTextContent('season')
    expect(JSON.parse(screen.getByTestId('handoff').textContent)).toBeNull()
  })

  it('clears the handoff when the beekeeper navigates elsewhere', () => {
    renderNav()
    press('dispatch-task')
    expect(JSON.parse(screen.getByTestId('handoff').textContent)).not.toBeNull()
    press('navigate-away')
    expect(screen.getByTestId('tab')).toHaveTextContent('myhive')
    expect(JSON.parse(screen.getByTestId('handoff').textContent)).toBeNull()
  })

  it('taps and wraps the change in a view transition when the browser supports it', () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })
    const startViewTransition = vi.fn((update) => update())
    document.startViewTransition = startViewTransition

    renderNav()
    press('navigate-away')

    expect(vibrate).toHaveBeenCalledWith(25)
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('tab')).toHaveTextContent('myhive')
  })

  it('hands the target screen no data for a colony that is gone', () => {
    const inspections = [{ id: 'i1', colonyId: 'a' }]
    renderNav({ colonies: [{ id: 'b' }], inspections })
    expect(JSON.parse(screen.getByTestId('scope').textContent)).toEqual({ inspections, colonyId: null })

    press('dispatch-colony')
    expect(JSON.parse(screen.getByTestId('scope').textContent)).toEqual({ inspections: [], colonyId: null })
    expect(screen.getByRole('status')).toHaveTextContent('The selected colony or task is no longer available.')
  })

  it('judges the colony half against live records, not the scope reported at consumption', () => {
    const { rerender } = renderNav({ colonies: [{ id: 'a' }] })
    press('dispatch-colony')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    rerender(<LanguageProvider><Nav colonies={[{ id: 'b' }]} /></LanguageProvider>)
    expect(screen.getByRole('status')).toHaveTextContent('The selected colony or task is no longer available.')
  })

  it('keeps a task verdict once the screen reported it for that selection', () => {
    renderNav()
    press('dispatch-task')
    press('report-available')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // A later week change must not rewrite a handoff that was consumed.
    press('report-missing')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // A new selection is decided afresh.
    press('dispatch-task')
    press('report-missing')
    expect(screen.getByRole('status')).toHaveTextContent('The selected colony or task is no longer available.')
  })

  it('shows the notice again for a later selection after the first one timed out', () => {
    renderNav({ colonies: [{ id: 'b' }] })
    press('dispatch-colony')
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    press('dispatch-colony')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
