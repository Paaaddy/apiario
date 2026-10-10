import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useProfile } from './useProfile'
import { useInspections } from './useInspections'
import { useColonyRemoval } from './useColonyRemoval'
import { getReloadStatus } from '../pwa/reloadSafety'
import { getRecoveryCause, hasStorageRecovery, recoverStorageTransaction } from '../utils/storageTransaction'

function useRecords() {
  const profile = useProfile()
  const inspections = useInspections()
  const removal = useColonyRemoval(profile.removeColony, inspections.removeInspectionsByColonyId)
  return { profile, inspections, removal }
}
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('apiario-profile', JSON.stringify({ schemaVersion: 3, colonies: [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }] }))
  localStorage.setItem('apiario-inspections', JSON.stringify([{ id: 'i', colonyId: 'a', date: false }]))
})
afterEach(() => {
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
  act(() => result.current.removal.remove('a'))
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
