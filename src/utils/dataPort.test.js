import { beforeEach, afterEach } from 'vitest'
import { exportData, importData } from './dataPort'

const PROFILE_KEY = 'apiario-profile'
const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'

function validPayload() {
  return JSON.stringify({
    format: 'apiario-backup',
    schemaVersion: 2,
    exportedAt: '2026-01-01T00:00:00.000Z',
    data: {
      profile: { hiveCount: 2, colonies: [] },
      inspections: [{ id: 'i1' }],
      log: [{ id: 'l1' }],
    },
  })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('exportData', () => {
  it('returns the apiario-backup envelope with defaults when nothing stored', () => {
    const out = exportData()
    expect(out.format).toBe('apiario-backup')
    expect(typeof out.schemaVersion).toBe('number')
    expect(typeof out.exportedAt).toBe('string')
    expect(out.data.profile).toEqual({})
    expect(out.data.inspections).toEqual([])
    expect(out.data.log).toEqual([])
  })

  it('reads the stored profile, inspections, and log', () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ hiveCount: 5, colonies: [{ id: 'col-1' }] }))
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify([{ id: 'i1' }, { id: 'i2' }]))
    localStorage.setItem(LOG_KEY, JSON.stringify([{ id: 'l1' }]))
    const out = exportData()
    expect(out.data.profile.hiveCount).toBe(5)
    expect(out.data.inspections).toHaveLength(2)
    expect(out.data.log).toHaveLength(1)
  })

  it('falls back to defaults when a stored key has invalid JSON', () => {
    localStorage.setItem(PROFILE_KEY, '{broken')
    localStorage.setItem(INSPECTIONS_KEY, '{broken')
    localStorage.setItem(LOG_KEY, '{broken')
    const out = exportData()
    expect(out.data.profile).toEqual({})
    expect(out.data.inspections).toEqual([])
    expect(out.data.log).toEqual([])
  })
})

describe('importData', () => {
  it('returns parsed data for a valid backup', () => {
    const result = importData(validPayload())
    expect(result.ok).toBe(true)
    expect(result.data.profile.hiveCount).toBe(2)
    expect(result.data.inspections).toEqual([{ id: 'i1' }])
    expect(result.data.log).toEqual([{ id: 'l1' }])
  })

  it('returns parse error for invalid JSON', () => {
    const result = importData('not json {{{')
    expect(result).toEqual({ ok: false, error: 'parse' })
  })

  it('returns format error for wrong format', () => {
    const result = importData(JSON.stringify({ format: 'something-else', data: {} }))
    expect(result).toEqual({ ok: false, error: 'format' })
  })

  it('returns format error when data is missing', () => {
    const result = importData(JSON.stringify({ format: 'apiario-backup' }))
    expect(result).toEqual({ ok: false, error: 'format' })
  })

  it('applies sensible defaults for missing slices', () => {
    const result = importData(
      JSON.stringify({ format: 'apiario-backup', data: {} })
    )
    expect(result.ok).toBe(true)
    expect(result.data.profile).toEqual({})
    expect(result.data.inspections).toEqual([])
    expect(result.data.log).toEqual([])
  })

  it('normalizes non-array inspections and log', () => {
    const result = importData(
      JSON.stringify({
        format: 'apiario-backup',
        data: { profile: { hiveCount: 1 }, inspections: 'oops', log: { bad: true } },
      })
    )
    expect(result.ok).toBe(true)
    expect(result.data.inspections).toEqual([])
    expect(result.data.log).toEqual([])
    expect(result.data.profile.hiveCount).toBe(1)
  })
})
