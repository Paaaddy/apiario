import { createElement } from 'react'
import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import { LanguageProvider } from '../context/LanguageContext'
import { useLanguage } from './useLanguage'
import { useBackupRestoreController } from './useBackupRestoreController'

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
      profile: { hiveCount: 2, colonies: [{ id: 'col-1', name: 'A' }] },
      inspections: [{ id: 'i1' }],
      log: [{ id: 'l1' }],
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
  localStorage.clear()
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
})

describe('useBackupRestoreController', () => {
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
    expect(JSON.parse(localStorage.getItem(INSPECTIONS_KEY))).toEqual([{ id: 'i1' }])
    expect(JSON.parse(localStorage.getItem(LOG_KEY))).toEqual([{ id: 'l1' }])
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
