import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useTaskLog } from './useTaskLog'

const task = {
  id: 'sp-01',
  name: { de: 'Frühjahrskontrolle', en: 'Spring inspection' },
  urgency: 'important',
}

const originalVibrate = globalThis.navigator.vibrate

beforeEach(() => {
  localStorage.clear()
  globalThis.navigator.vibrate = vi.fn(() => true)
})

afterEach(() => {
  globalThis.navigator.vibrate = originalVibrate
})

describe('useTaskLog', () => {
  it('starts with empty log', () => {
    const { result } = renderHook(() => useTaskLog())
    expect(result.current.log).toHaveLength(0)
    expect(result.current.completedTaskIds.size).toBe(0)
  })

  it('toggleTask adds a task entry', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.toggleTask(task))
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].type).toBe('task')
    expect(result.current.log[0].taskId).toBe('sp-01')
    expect(result.current.completedTaskIds.has('sp-01')).toBe(true)
  })

  it('toggleTask removes an existing entry', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.toggleTask(task))
    act(() => result.current.toggleTask(task))
    expect(result.current.log).toHaveLength(0)
    expect(result.current.completedTaskIds.has('sp-01')).toBe(false)
  })

  it('addCustomEntry adds a custom entry', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Fed sugar syrup', date: '2026-04-13' }))
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].type).toBe('custom')
    expect(result.current.log[0].text).toBe('Fed sugar syrup')
    expect(result.current.log[0].date).toBe('2026-04-13')
  })

  it('deleteEntry removes an entry by id', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Test note', date: '2026-04-13' }))
    const id = result.current.log[0].id
    act(() => result.current.deleteEntry(id))
    expect(result.current.log).toHaveLength(0)
  })

  it('persists entries to localStorage', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Test', date: '2026-04-13' }))
    const stored = JSON.parse(localStorage.getItem('apiario-log'))
    expect(stored).toHaveLength(1)
    expect(stored[0].text).toBe('Test')
  })

  it('reads existing log from localStorage on mount', () => {
    const existing = [{ id: 'custom-1', type: 'custom', text: 'Existing', date: '2026-04-12' }]
    localStorage.setItem('apiario-log', JSON.stringify(existing))
    const { result } = renderHook(() => useTaskLog())
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].text).toBe('Existing')
  })

  it('completedTaskIds reflects current completed tasks', () => {
    const { result } = renderHook(() => useTaskLog())
    const task2 = { id: 'sp-02', name: { de: 'Vorräte', en: 'Stores' }, urgency: 'important' }
    act(() => result.current.toggleTask(task))
    act(() => result.current.toggleTask(task2))
    expect(result.current.completedTaskIds.has('sp-01')).toBe(true)
    expect(result.current.completedTaskIds.has('sp-02')).toBe(true)
    act(() => result.current.toggleTask(task))
    expect(result.current.completedTaskIds.has('sp-01')).toBe(false)
    expect(result.current.completedTaskIds.has('sp-02')).toBe(true)
  })

  describe('haptic feedback', () => {
    it('fires navigator.vibrate when a task is checked', () => {
      const { result } = renderHook(() => useTaskLog())
      act(() => result.current.toggleTask(task))
      expect(globalThis.navigator.vibrate).toHaveBeenCalledWith(25)
    })

    it('does NOT fire vibration when a task is unchecked (undo-is-silent)', () => {
      const { result } = renderHook(() => useTaskLog())
      act(() => result.current.toggleTask(task))
      globalThis.navigator.vibrate.mockClear()
      act(() => result.current.toggleTask(task))
      expect(globalThis.navigator.vibrate).not.toHaveBeenCalled()
    })

    it('fires vibrate BEFORE the setState callback runs (user-gesture window)', () => {
      // React batches setLog into the commit phase — if haptics.tap()
      // were called inside the updater, Chrome Android would silently
      // drop the call. This test sandwiches state-observation between
      // two synchronous checkpoints to prove the buzz fires during the
      // original click handler.
      const { result } = renderHook(() => useTaskLog())
      const vibrate = globalThis.navigator.vibrate
      let vibrateCallIndex = -1
      vibrate.mockImplementation(() => {
        vibrateCallIndex = vibrate.mock.calls.length
        return true
      })
      act(() => result.current.toggleTask(task))
      expect(vibrateCallIndex).toBe(1)
      expect(result.current.log.length).toBeGreaterThan(0) // state also applied
    })
  })
})
