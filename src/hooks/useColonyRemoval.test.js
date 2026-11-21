import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useProfile } from './useProfile'
import { useInspections } from './useInspections'
import { UNDO_WINDOW_MS, flushPendingColonyRemoval, useColonyRemoval } from './useColonyRemoval'
import { getReloadStatus } from '../pwa/reloadSafety'
import { getRecoveryCause, hasStorageRecovery, recoverStorageTransaction } from '../utils/storageEngine'

function useRecords() {
  const profile = useProfile()
  const inspections = useInspections()
  const removal = useColonyRemoval(profile.removeColony, inspections.removeInspectionsByColonyId, { colonies: profile.profile.colonies })
  return { profile, inspections, removal }
}
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('apiario-profile', JSON.stringify({ schemaVersion: 3, colonies: [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }] }))
  localStorage.setItem('apiario-inspections', JSON.stringify([{ id: 'i', colonyId: 'a', date: false }]))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  if (hasStorageRecovery()) recoverStorageTransaction()
  localStorage.clear()
})

it('keeps recovery and visible records after rollback failure, blocks writes, and retries latest changes after recovery', () => {
  const previous = localStorage.getItem('apiario-inspections')
  const write = Storage.prototype.setItem
  const { result } = renderHook(useRecords)
  const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === 'apiario-profile' || (key === 'apiario-inspections' && value === previous)) throw new Error('Full')
    return write.call(this, key, value)
  })
  vi.useFakeTimers()
  act(() => result.current.removal.remove('a'))
  expect(result.current.removal.undoable).toEqual({ colonyId: 'a', name: 'Apple' })
  act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
  expect(result.current.removal.undoable).toBeNull()
  expect(result.current.removal.pendingColonyId).toBe('a')
  expect(result.current.profile.profile.colonies).toHaveLength(2)
  expect(result.current.inspections.inspections).toHaveLength(1)
  expect(hasStorageRecovery()).toBe(true)
  expect(getRecoveryCause()).toBe('mutation')
  expect(getReloadStatus().blocked).toBe(true)
  act(() => result.current.profile.updateColony('b', { notes: 'Newer draft' }))
  expect(result.current.profile.persistenceError).not.toBeNull()
  expect(recoverStorageTransaction().ok).toBe(false)
  writes.mockRestore()
  act(() => recoverStorageTransaction())
  expect(localStorage.getItem('apiario-inspections')).toBe(previous)
  act(() => result.current.removal.retry())
  expect(JSON.parse(localStorage.getItem('apiario-profile')).colonies).toEqual([{ id: 'b', name: 'Birch', notes: 'Newer draft' }])
  expect(result.current.inspections.inspections).toEqual([])
  expect(result.current.profile.persistenceError).toBeNull()
  expect(hasStorageRecovery()).toBe(false)
  expect(getReloadStatus().blocked).toBe(false)
})

const stored = () => ({
  profile: localStorage.getItem('apiario-profile'),
  inspections: localStorage.getItem('apiario-inspections'),
})
const colonyIds = () => JSON.parse(localStorage.getItem('apiario-profile')).colonies.map((colony) => colony.id)

describe('undo window', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.setItem('apiario-inspections', JSON.stringify([
      { id: 'i1', colonyId: 'a', date: '2026-04-01' },
      { id: 'i2', colonyId: 'b', date: '2026-04-02' },
    ]))
  })

  it('writes nothing while the window is open, and Undo leaves every record byte-for-byte', () => {
    const { result } = renderHook(useRecords)
    const before = stored()
    act(() => result.current.removal.remove('a'))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS - 1))
    expect(result.current.removal.undoable.colonyId).toBe('a')
    expect(stored()).toEqual(before)

    act(() => result.current.removal.undo())
    expect(result.current.removal.undoable).toBeNull()
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS * 2))
    expect(stored()).toEqual(before)
    expect(result.current.profile.profile.colonies).toHaveLength(2)
    expect(result.current.inspections.inspections.map((inspection) => inspection.id)).toEqual(['i1', 'i2'])
  })

  it('removes the Colony and only its Inspections when the window ends', () => {
    const { result } = renderHook(useRecords)
    act(() => result.current.removal.remove('a'))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    expect(colonyIds()).toEqual(['b'])
    expect(result.current.inspections.inspections.map((inspection) => inspection.id)).toEqual(['i2'])
    expect(result.current.removal.undoable).toBeNull()
    expect(result.current.removal.pendingColonyId).toBeNull()
  })

  it('commits the first deletion when a second starts, and only the second stays undoable', () => {
    const { result } = renderHook(useRecords)
    act(() => result.current.removal.remove('a'))
    act(() => result.current.removal.remove('b'))
    expect(colonyIds()).toEqual(['b'])
    expect(result.current.removal.undoable.colonyId).toBe('b')

    act(() => result.current.removal.undo())
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    expect(colonyIds()).toEqual(['b'])
    expect(result.current.inspections.inspections.map((inspection) => inspection.id)).toEqual(['i2'])
  })

  it('both deletions are committed when neither is undone', () => {
    const { result } = renderHook(useRecords)
    act(() => result.current.removal.remove('a'))
    act(() => result.current.removal.remove('b'))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    expect(colonyIds()).toEqual([])
    expect(result.current.inspections.inspections).toEqual([])
  })

  it('a new window starts for the second deletion rather than inheriting the first timer', () => {
    const { result } = renderHook(useRecords)
    act(() => result.current.removal.remove('a'))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS - 1000))
    act(() => result.current.removal.remove('b'))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS - 1))
    expect(result.current.removal.undoable.colonyId).toBe('b')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.removal.undoable).toBeNull()
  })

  it('leaving the page commits the open deletion', () => {
    const { result } = renderHook(useRecords)
    act(() => result.current.removal.remove('a'))
    act(() => { window.dispatchEvent(new Event('pagehide')) })
    expect(colonyIds()).toEqual(['b'])
    expect(result.current.removal.undoable).toBeNull()
  })

  it('flushPendingColonyRemoval commits an open deletion for backup, and is a no-op with none', () => {
    const { result } = renderHook(useRecords)
    expect(() => flushPendingColonyRemoval()).not.toThrow()
    expect(colonyIds()).toEqual(['a', 'b'])
    act(() => result.current.removal.remove('a'))
    act(() => flushPendingColonyRemoval())
    expect(colonyIds()).toEqual(['b'])
  })

  it('a failed commit shows the Colony again and is never silent', () => {
    const { result } = renderHook(useRecords)
    const before = stored()
    const write = Storage.prototype.setItem
    const failing = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === 'apiario-profile') throw new Error('Full')
      return write.call(this, key, value)
    })
    act(() => result.current.removal.remove('a'))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    expect(result.current.removal.undoable).toBeNull()
    expect(result.current.removal.pendingColonyId).toBe('a')
    expect(result.current.profile.profile.colonies).toHaveLength(2)
    expect(stored().profile).toBe(before.profile)
    failing.mockRestore()
    if (hasStorageRecovery()) act(() => recoverStorageTransaction())
    act(() => result.current.removal.retry())
    expect(colonyIds()).toEqual(['b'])
    expect(result.current.removal.pendingColonyId).toBeNull()
  })
})
