import { createElement } from 'react'
import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import { LanguageProvider } from '../context/LanguageContext'
import { useLanguage } from './useLanguage'
import { useBackupRestoreController } from './useBackupRestoreController'
import { cancelPendingReload, getReloadStatus, protectReload, requestAppReload } from '../pwa/reloadSafety'

const PROFILE_KEY = 'apiario-profile'
const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'

function makeFile(text) {
  return new File([text], 'backup.json', { type: 'application/json' })
}

function validPayload() {
  return JSON.stringify({
    format: 'apiario-backup',
    schemaVersion: 2,
    exportedAt: '2026-01-01T00:00:00.000Z',
    data: {
      profile: { schemaVersion: 3, hiveCount: 2, colonies: [{ id: 'col-1', name: 'A' }] },
      inspections: [{ id: 'i1', colonyId: 'col-1', date: '2026-01-01', queenStatus: 'seen' }],
      log: [{ id: 'l1', type: 'custom', text: 'Observed flight', date: '2026-01-01' }],
    },
  })
}

function wrapper({ children }) {
  return createElement(LanguageProvider, null, children)
}

function useController(reload) {
  const { t } = useLanguage()
  return useBackupRestoreController(t, reload)
}

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('apiario-locale', 'en')
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
})

describe('useBackupRestoreController', () => {
  it('deliberately reloads after successful Backup replacement even with a protected draft/update', async () => {
    const token = {}, updateReload = vi.fn(), restoreReload = vi.fn()
    protectReload(token, true)
    requestAppReload(updateReload)
    try {
      const { result } = renderHook(() => useController(restoreReload), { wrapper })
      await act(async () => result.current.restoreBackupFile(makeFile(validPayload())))
      expect(restoreReload).toHaveBeenCalledOnce()
      expect(updateReload).not.toHaveBeenCalled()
    } finally {
      protectReload(token, false)
      cancelPendingReload(updateReload)
    }
  })

  it('defers an update during Backup recovery and does not automatically reload when recovery succeeds', async () => {
    const previous = '{"hiveCount":1}'
    localStorage.setItem(PROFILE_KEY, previous)
    const write = Storage.prototype.setItem
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === INSPECTIONS_KEY || (key === PROFILE_KEY && value === previous)) throw new Error('Full')
      return write.call(this, key, value)
    })
    const reload = vi.fn()
    const { result } = renderHook(() => useController(reload), { wrapper })
    await act(async () => result.current.restoreBackupFile(makeFile(validPayload())))
    act(() => requestAppReload(reload))
    expect(getReloadStatus()).toMatchObject({ pending: true, blocked: true })
    writes.mockRestore()
    act(() => result.current.recoverPreviousData())
    expect(getReloadStatus()).toMatchObject({ pending: true, blocked: false })
    expect(reload).not.toHaveBeenCalled()
    cancelPendingReload(reload)
  })

  it('keeps failed restore recovery available until the prior records can be recovered', async () => {
    const previous = '{"hiveCount":1}'
    localStorage.setItem(PROFILE_KEY, previous)
    const setItem = Storage.prototype.setItem
    let storageAvailable = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (!storageAvailable && (key === INSPECTIONS_KEY || (key === PROFILE_KEY && value === previous))) {
        throw new DOMException('Storage unavailable', 'QuotaExceededError')
      }
      return setItem.call(this, key, value)
    })
    const reload = vi.fn()
    let { result, unmount } = renderHook(() => useController(reload), { wrapper })
    await act(async () => { await result.current.restoreBackupFile(makeFile(validPayload())) })
    expect(result.current.status).toEqual({
      kind: 'error', message: 'Restoration and recovery failed. Do not reload; retry recovering your previous records.',
    })
    expect(result.current.canRecover).toBe(true)
    await act(async () => { await result.current.restoreBackupFile(makeFile(validPayload())) })
    expect(result.current.canRecover).toBe(true)
    unmount()
    ;({ result } = renderHook(() => useController(reload), { wrapper }))
    expect(result.current.canRecover).toBe(true)
    storageAvailable = true
    await act(async () => { result.current.recoverPreviousData() })
    expect(result.current.canRecover).toBe(false)
    expect(localStorage.getItem(PROFILE_KEY)).toBe(previous)
    expect(localStorage.getItem(INSPECTIONS_KEY)).toBeNull()
    expect(localStorage.getItem(LOG_KEY)).toBeNull()
    expect(result.current.status).toEqual({ kind: 'success', message: 'Previous records recovered. You can try importing again.' })
    expect(reload).not.toHaveBeenCalled()
  })

  it.each([
    ['en', 'Something went wrong during import.'],
    ['de', 'Beim Import ist etwas schiefgelaufen.'],
  ])('reports an unreadable file in %s without reloading', async (locale, message) => {
    localStorage.setItem('apiario-locale', locale)
    const reload = vi.fn()
    const file = { text: async () => { throw new Error('Read failed') } }
    const { result } = renderHook(() => useController(reload), { wrapper })
    await act(async () => { await result.current.restoreBackupFile(file) })
    expect(result.current.status).toEqual({ kind: 'error', message })
    expect(reload).not.toHaveBeenCalled()
  })

  it('sets an exported status after export', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { result } = renderHook(() => useController(vi.fn()), { wrapper })

    act(() => result.current.exportBackupFile())

    expect(result.current.status).toEqual({ kind: 'success', message: 'Exported' })
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('restores a valid backup and executes the reload intent', async () => {
    const reload = vi.fn()
    const { result } = renderHook(() => useController(reload), { wrapper })

    await act(async () => {
      await result.current.restoreBackupFile(makeFile(validPayload()))
    })

    expect(result.current.status).toEqual({ kind: 'success', message: 'Data loaded. Reloading app…' })
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY)).hiveCount).toBe(2)
    expect(JSON.parse(localStorage.getItem(INSPECTIONS_KEY))).toEqual(JSON.parse(validPayload()).data.inspections)
    expect(JSON.parse(localStorage.getItem(LOG_KEY))).toEqual(JSON.parse(validPayload()).data.log)
    expect(reload).toHaveBeenCalled()
  })

  it('sets an error status without reloading for invalid JSON', async () => {
    const reload = vi.fn()
    const { result } = renderHook(() => useController(reload), { wrapper })

    await act(async () => {
      await result.current.restoreBackupFile(makeFile('{{{ nope'))
    })

    expect(result.current.status).toEqual({ kind: 'error', message: 'Not a valid JSON file.' })
    expect(reload).not.toHaveBeenCalled()
  })
})
