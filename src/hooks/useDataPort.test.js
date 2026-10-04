import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import { useDataPort } from './useDataPort'

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

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
})

describe('useDataPort.exportData', () => {
  it('reads the three storage keys into the backup payload', () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ hiveCount: 3, colonies: [] }))
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify([{ id: 'i1' }]))
    localStorage.setItem(LOG_KEY, JSON.stringify([{ id: 'l1' }, { id: 'l2' }]))

    const { result } = renderHook(() => useDataPort())
    let data
    act(() => {
      data = result.current.exportData()
    })

    expect(data.format).toBe('apiario-backup')
    expect(data.data.profile.hiveCount).toBe(3)
    expect(data.data.inspections).toEqual([{ id: 'i1' }])
    expect(data.data.log).toHaveLength(2)
  })

  it('triggers a download without throwing in jsdom', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { result } = renderHook(() => useDataPort())
    expect(() => act(() => result.current.exportData())).not.toThrow()
    expect(clickSpy).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})

describe('useDataPort.importData', () => {
  it('does not replace records when the prior dataset cannot be read', async () => {
    const previous = '{"hiveCount":1}'
    localStorage.setItem(PROFILE_KEY, previous)
    const getItem = Storage.prototype.getItem
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (key) {
      if (key === LOG_KEY) throw new DOMException('Access denied', 'SecurityError')
      return getItem.call(this, key)
    })
    const { result } = renderHook(() => useDataPort())
    let outcome
    await act(async () => { outcome = await result.current.importData(makeFile(validPayload())) })
    read.mockRestore()
    expect(outcome).toMatchObject({ ok: false, error: 'unexpected', requiresReload: false })
    expect(localStorage.getItem(PROFILE_KEY)).toBe(previous)
    expect(localStorage.getItem(INSPECTIONS_KEY)).toBeNull()
    expect(localStorage.getItem(LOG_KEY)).toBeNull()
  })

  it('prepares every serialized slice before replacing any records', async () => {
    const previous = '{"hiveCount":1}'
    localStorage.setItem(PROFILE_KEY, previous)
    const text = '{"format":"apiario-backup","data":{"profile":{"extension":' +
      '['.repeat(10_000) + 'null' + ']'.repeat(10_000) + '}}}'
    const { result } = renderHook(() => useDataPort())
    let outcome
    await act(async () => { outcome = await result.current.importData(makeFile(text)) })
    expect(outcome).toMatchObject({ ok: false, error: 'unexpected', requiresReload: false })
    expect(localStorage.getItem(PROFILE_KEY)).toBe(previous)
    expect(localStorage.getItem(INSPECTIONS_KEY)).toBeNull()
  })

  it('rejects malformed records without replacing the prior dataset', async () => {
    const previous = '{"hiveCount":1}'
    localStorage.setItem(PROFILE_KEY, previous)
    const backup = JSON.parse(validPayload())
    backup.data.inspections = [null]
    const { result } = renderHook(() => useDataPort())
    let outcome
    await act(async () => { outcome = await result.current.importData(makeFile(JSON.stringify(backup))) })
    expect(outcome).toMatchObject({ ok: false, error: 'format', requiresReload: false })
    expect(localStorage.getItem(PROFILE_KEY)).toBe(previous)
    expect(localStorage.getItem(INSPECTIONS_KEY)).toBeNull()
  })

  it('rejects oversized files before reading them', async () => {
    const text = vi.fn()
    const file = { size: 5 * 1024 * 1024 + 1, text }
    const { result } = renderHook(() => useDataPort())
    let outcome
    await act(async () => { outcome = await result.current.importData(file) })
    expect(outcome).toMatchObject({ ok: false, error: 'size', requiresReload: false })
    expect(text).not.toHaveBeenCalled()
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull()
  })

  it.each([PROFILE_KEY, INSPECTIONS_KEY, LOG_KEY])('preserves the exact prior dataset when writing %s fails', async (failedKey) => {
    const previousProfile = '{"hiveCount":1}'
    const previousLog = '[{"old":true}]'
    localStorage.setItem(PROFILE_KEY, previousProfile)
    localStorage.setItem(LOG_KEY, previousLog)
    const setItem = Storage.prototype.setItem
    let failed = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === failedKey && !failed) {
        failed = true
        throw new DOMException('Storage full', 'QuotaExceededError')
      }
      return setItem.call(this, key, value)
    })
    const { result } = renderHook(() => useDataPort())
    let outcome
    await act(async () => { outcome = await result.current.importData(makeFile(validPayload())) })
    expect(outcome).toMatchObject({ ok: false, requiresReload: false })
    expect(localStorage.getItem(PROFILE_KEY)).toBe(previousProfile)
    expect(localStorage.getItem(INSPECTIONS_KEY)).toBeNull()
    expect(localStorage.getItem(LOG_KEY)).toBe(previousLog)
  })

  it('writes profile, inspections, and log on a valid file', async () => {
    const { result } = renderHook(() => useDataPort())
    let res
    await act(async () => {
      res = await result.current.importData(makeFile(validPayload()))
    })
    expect(res.ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY)).hiveCount).toBe(2)
    expect(JSON.parse(localStorage.getItem(INSPECTIONS_KEY))).toEqual(JSON.parse(validPayload()).data.inspections)
    expect(JSON.parse(localStorage.getItem(LOG_KEY))).toEqual(JSON.parse(validPayload()).data.log)
  })

  it('returns parse error for invalid JSON and writes nothing', async () => {
    const { result } = renderHook(() => useDataPort())
    let res
    await act(async () => {
      res = await result.current.importData(makeFile('{{{ not json'))
    })
    expect(res).toMatchObject({ ok: false, error: 'parse', messageKey: 'data_import_error_parse', requiresReload: false })
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull()
    expect(localStorage.getItem(INSPECTIONS_KEY)).toBeNull()
    expect(localStorage.getItem(LOG_KEY)).toBeNull()
  })

  it('returns format error for a wrong-format file and writes nothing', async () => {
    const { result } = renderHook(() => useDataPort())
    let res
    await act(async () => {
      res = await result.current.importData(makeFile(JSON.stringify({ format: 'nope', data: {} })))
    })
    expect(res).toMatchObject({ ok: false, error: 'format', messageKey: 'data_import_error_format', requiresReload: false })
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull()
  })
})
