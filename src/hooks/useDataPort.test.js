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
      profile: { hiveCount: 2, colonies: [{ id: 'col-1', name: 'A' }] },
      inspections: [{ id: 'i1' }],
      log: [{ id: 'l1' }],
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
  it('writes profile, inspections, and log on a valid file', async () => {
    const { result } = renderHook(() => useDataPort())
    let res
    await act(async () => {
      res = await result.current.importData(makeFile(validPayload()))
    })
    expect(res.ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY)).hiveCount).toBe(2)
    expect(JSON.parse(localStorage.getItem(INSPECTIONS_KEY))).toEqual([{ id: 'i1' }])
    expect(JSON.parse(localStorage.getItem(LOG_KEY))).toEqual([{ id: 'l1' }])
  })

  it('returns parse error for invalid JSON and writes nothing', async () => {
    const { result } = renderHook(() => useDataPort())
    let res
    await act(async () => {
      res = await result.current.importData(makeFile('{{{ not json'))
    })
    expect(res).toEqual({ ok: false, error: 'parse' })
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
    expect(res).toEqual({ ok: false, error: 'format' })
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull()
  })
})
