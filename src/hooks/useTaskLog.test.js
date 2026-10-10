import { renderHook, act } from '@testing-library/react'
import { createElement, StrictMode } from 'react'
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
  vi.restoreAllMocks()
})

describe('useTaskLog', () => {
  it('keeps same-millisecond custom entries uniquely identified and reloadable', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345)
    const { result, unmount } = renderHook(() => useTaskLog())
    act(() => {
      result.current.addCustomEntry({ text: 'First', date: '2026-05-01' })
      result.current.addCustomEntry({ text: 'Second', date: '2026-05-01' })
    })
    expect(new Set(result.current.log.map((entry) => entry.id)).size).toBe(2)
    unmount()
    const loaded = renderHook(() => useTaskLog())
    expect(loaded.result.current.log).toHaveLength(2)
    expect(loaded.result.current.persistenceError).toBeNull()
  })

  it('does not replay log writes or haptics in StrictMode and clears errors on successful mutations', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useTaskLog(), {
      wrapper: ({ children }) => createElement(StrictMode, null, children),
    })
    expect(result.current.persistenceError).toBeNull()
    expect(write).not.toHaveBeenCalled()
    act(() => result.current.toggleTask(task))
    expect(write).toHaveBeenCalledTimes(1)
    expect(globalThis.navigator.vibrate).toHaveBeenCalledTimes(1)
    write.mockImplementationOnce(() => { throw new Error('Storage unavailable') })
    act(() => result.current.toggleTask(task))
    expect(write).toHaveBeenCalledTimes(2)
    expect(result.current.completedTaskIds.size).toBe(0)
    expect(result.current.persistenceError?.error).toBe('storage')
    act(() => result.current.addCustomEntry({ text: 'Fed syrup', date: '2026-04-13' }))
    expect(write).toHaveBeenCalledTimes(3)
    expect(globalThis.navigator.vibrate).toHaveBeenCalledTimes(1)
    expect(result.current.persistenceError).toBeNull()
  })

  it('applies batched log mutations and retries the latest log before a render', () => {
    const { result, unmount } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Old note', date: '2026-04-12' }))
    const oldId = result.current.log[0].id
    globalThis.navigator.vibrate.mockClear()
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    const secondTask = { id: 'sp-02', name: { de: 'Vorräte', en: 'Stores' } }
    act(() => {
      result.current.toggleTask(task)
      result.current.toggleTask(task)
      result.current.toggleTask(secondTask)
      result.current.deleteEntry(oldId)
      result.current.addCustomEntry({ text: 'Fed syrup', date: '2026-04-13' })
      write.mockRestore()
      expect(result.current.retrySave()).toEqual({ ok: true })
    })
    expect(globalThis.navigator.vibrate).toHaveBeenCalledTimes(2)
    expect(result.current.completedTaskIds).toEqual(new Set(['sp-02']))
    expect(result.current.log).toHaveLength(2)
    expect(result.current.log.find((entry) => entry.type === 'custom').text).toBe('Fed syrup')
    expect(result.current.persistenceError).toBeNull()
    unmount()
    const remounted = renderHook(() => useTaskLog())
    expect(remounted.result.current.completedTaskIds).toEqual(new Set(['sp-02']))
    expect(remounted.result.current.log).toHaveLength(2)
    expect(remounted.result.current.log.find((entry) => entry.type === 'custom').text).toBe('Fed syrup')
  })

  it('keeps failed log changes unsaved until retry persists the latest entries', () => {
    const { result, unmount } = renderHook(() => useTaskLog())
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError')
    })
    act(() => result.current.toggleTask(task))
    expect(result.current.completedTaskIds.has(task.id)).toBe(true)
    expect(result.current.persistenceError).toEqual({
      ok: false, error: 'storage', messageKey: 'storage_error', requiresReload: false,
    })
    act(() => result.current.addCustomEntry({ text: 'Fed syrup', date: '2026-04-13' }))
    act(() => result.current.retrySave())
    expect(result.current.persistenceError?.error).toBe('storage')
    write.mockRestore()
    act(() => result.current.retrySave())
    expect(result.current.persistenceError).toBeNull()
    unmount()
    const remounted = renderHook(() => useTaskLog())
    expect(remounted.result.current.completedTaskIds.has(task.id)).toBe(true)
    expect(remounted.result.current.log.find((entry) => entry.type === 'custom').text).toBe('Fed syrup')
    expect(remounted.result.current.persistenceError).toBeNull()
  })

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

  it('returns empty log when localStorage contains invalid JSON', () => {
    localStorage.setItem('apiario-log', '{corrupted')
    const { result } = renderHook(() => useTaskLog())
    expect(result.current.log).toEqual([])
  })

  it('caps log at 500 entries when localStorage seed exceeds MAX_ENTRIES', () => {
    localStorage.setItem('apiario-log', JSON.stringify(
      Array.from({ length: 501 }, (_, i) => ({
        id: `task-t${i}-0`, type: 'task', taskId: `t${i}`, completedAt: '2026-01-01',
      }))
    ))
    const { result } = renderHook(() => useTaskLog())
    expect(result.current.log).toHaveLength(500)
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
