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
      profile: { schemaVersion: 3, hiveCount: 2, colonies: [{ id: 'col-1', name: 'A' }] },
      inspections: [{ id: 'i1', colonyId: 'col-1', date: '2026-01-01', queenStatus: 'seen' }],
      log: [{ id: 'l1', type: 'custom', text: 'Observed flight', date: '2026-01-01' }],
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
  it('accepts the exact 5 MiB UTF-8 boundary without truncating additive data', () => {
    const backup = JSON.parse(validPayload())
    backup.data.profile.extension = ''
    const extraBytes = 5 * 1024 * 1024 - new Blob([JSON.stringify(backup)]).size
    backup.data.profile.extension = 'a'.repeat(extraBytes)
    const raw = JSON.stringify(backup)
    const outcome = importData(raw)
    expect(outcome.ok).toBe(true)
    expect(outcome.data.profile.extension).toHaveLength(extraBytes)
  })

  it.each([[10_000, true], [10_001, false]])('bounds legacy auto-seeding at %i Colonies', (hiveCount, ok) => {
    const raw = JSON.stringify({ format: 'apiario-backup', data: { profile: { hiveCount } } })
    expect(importData(raw).ok).toBe(ok)
  })

  it.each([
    { id: 'l1', type: 'custom', text: 'Flight', date: '2026-01-01', completedAt: {} },
    { id: 'l1', type: 'task', taskId: 'sp-01', taskName: { de: 'Prüfen', en: 'Check' }, date: {} },
  ])('rejects unsafe alternate log dates consumed by history sorting: %j', (entry) => {
    const backup = JSON.parse(validPayload())
    backup.data.log = [entry]
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'format' })
  })

  it('validates legacy Inspection ownership against the Colonies that migration will seed', () => {
    const backup = JSON.parse(validPayload())
    backup.data.profile = { schemaVersion: 1, hiveCount: 1 }
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: true })
    backup.data.profile.colonies = [{ id: 'obsolete', name: 'Discarded by legacy migration' }]
    backup.data.inspections[0].colonyId = 'obsolete'
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'format' })
  })

  it.each([500, 501])('enforces the existing %i task-log retention boundary without truncation', (count) => {
    const backup = JSON.parse(validPayload())
    backup.data.log = Array.from({ length: count }, (_, index) => ({
      id: `log-${index}`, type: 'custom', text: 'Flight', date: '2026-01-01',
    }))
    const outcome = importData(JSON.stringify(backup))
    expect(outcome.ok).toBe(count === 500)
    if (count === 500) expect(outcome.data.log).toHaveLength(500)
  })

  it.each([500, 501])('enforces the existing %i per-Colony Inspection boundary without truncation', (count) => {
    const backup = JSON.parse(validPayload())
    backup.data.inspections = Array.from({ length: count }, (_, index) => ({
      id: `inspection-${index}`, colonyId: 'col-1', date: '2026-01-01', queenStatus: 'seen',
    }))
    const outcome = importData(JSON.stringify(backup))
    expect(outcome.ok).toBe(count === 500)
    if (count === 500) expect(outcome.data.inspections).toHaveLength(500)
  })

  it('applies the byte limit to UTF-8 text, not only its character count', () => {
    const backup = JSON.parse(validPayload())
    backup.data.profile.extension = '🐝'.repeat(1_400_000)
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'size' })
  })

  it('rejects legacy Colony auto-seeding that would amplify a tiny Backup into unbounded allocations', () => {
    expect(importData(JSON.stringify({ format: 'apiario-backup', data: { profile: { hiveCount: 1e12 } } })))
      .toMatchObject({ ok: false, error: 'format' })
  })

  it('accepts supported legacy profile migrations without requiring modern optional fields', () => {
    expect(importData(JSON.stringify({ format: 'apiario-backup', data: { profile: { hiveCount: 2 } } })))
      .toMatchObject({ ok: true, data: { profile: { hiveCount: 2 } } })
  })

  it('rejects a null Inspection rather than accepting records that crash consumers', () => {
    const backup = JSON.parse(validPayload())
    backup.data.inspections = [null]
    expect(importData(JSON.stringify(backup))).toMatchObject({
      ok: false, error: 'format', requiresReload: false,
    })
  })

  it('returns parsed data for a valid backup', () => {
    const result = importData(validPayload())
    expect(result.ok).toBe(true)
    expect(result.data.profile.hiveCount).toBe(2)
    expect(result.data.inspections).toEqual(JSON.parse(validPayload()).data.inspections)
    expect(result.data.log).toEqual(JSON.parse(validPayload()).data.log)
  })

  it('returns parse error for invalid JSON', () => {
    const result = importData('not json {{{')
    expect(result).toMatchObject({ ok: false, error: 'parse', messageKey: 'data_import_error_parse', requiresReload: false })
  })

  it('returns format error for wrong format', () => {
    const result = importData(JSON.stringify({ format: 'something-else', data: {} }))
    expect(result).toMatchObject({ ok: false, error: 'format', messageKey: 'data_import_error_format', requiresReload: false })
  })

  it('returns format error when data is missing', () => {
    const result = importData(JSON.stringify({ format: 'apiario-backup' }))
    expect(result).toMatchObject({ ok: false, error: 'format', messageKey: 'data_import_error_format', requiresReload: false })
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

  it.each([
    { profile: null }, { profile: [] }, { profile: 'oops' },
    { inspections: null }, { inspections: 'oops' },
    { log: null }, { log: {} },
  ])('rejects malformed supplied data rather than replacing it with defaults: %j', (data) => {
    expect(importData(JSON.stringify({ format: 'apiario-backup', data })))
      .toMatchObject({ ok: false, error: 'format', requiresReload: false })
  })

  it.each([null, [], 'oops', 1])('rejects a malformed data envelope: %j', (data) => {
    expect(importData(JSON.stringify({ format: 'apiario-backup', data }))).toMatchObject({ ok: false, error: 'format' })
  })

  it.each([0, -1, 3, '2', null, 1.5])('rejects an unsupported Backup version: %j', (schemaVersion) => {
    expect(importData(JSON.stringify({ ...JSON.parse(validPayload()), schemaVersion })))
      .toMatchObject({ ok: false, error: 'format' })
  })

  it('accepts a known legacy Backup and preserves additive fields', () => {
    const backup = JSON.parse(validPayload())
    backup.schemaVersion = 1
    backup.data.profile.extension = { untouched: true }
    expect(importData(JSON.stringify(backup))).toMatchObject({
      ok: true, data: { profile: { extension: { untouched: true } } },
    })
  })

  it.each([
    ['profile', { schemaVersion: 4 }],
    ['profile', { experience: 9 }],
    ['profile', { climateZone: 'unknown' }],
    ['profile', { hiveCount: -1 }],
    ['profile', { onboardingDone: 'yes' }],
    ['profile', { colonies: [null] }],
    ['profile', { colonies: [{ id: 'c1', name: {} }] }],
    ['profile', { colonies: [{ id: 'c1', name: 'A', notes: [] }] }],
    ['inspections', [{ id: 'i1' }]],
    ['inspections', [{ id: 'i1', colonyId: 'col-1', queenStatus: 'unknown' }]],
    ['inspections', [{ id: 'i1', colonyId: 'col-1', broodPattern: 6 }]],
    ['inspections', [{ id: 'i1', colonyId: 'col-1', population: '5' }]],
    ['inspections', [{ id: 'i1', colonyId: 'col-1', varroa: -1 }]],
    ['inspections', [{ id: 'i1', colonyId: 'col-1', harvest: -1 }]],
    ['inspections', [{ id: 'i1', colonyId: 'col-1', notes: {} }]],
    ['log', [null]],
    ['log', [{ id: 'l1', type: 'other' }]],
    ['log', [{ id: 'l1', type: 'custom', text: {} }]],
    ['log', [{ id: 'l1', type: 'task', taskId: 'sp-01', taskName: {} }]],
  ])('rejects unsafe record shapes in %s: %j', (slice, replacement) => {
    const backup = JSON.parse(validPayload())
    backup.data[slice] = replacement
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'format' })
  })

  it.each(['profile', 'inspections', 'log'])('rejects duplicate identifiers in %s', (slice) => {
    const backup = JSON.parse(validPayload())
    const list = slice === 'profile' ? backup.data.profile.colonies : backup.data[slice]
    list.push({ ...list[0] })
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'format' })
  })

  it('rejects an Inspection belonging to a missing Colony', () => {
    const backup = JSON.parse(validPayload())
    backup.data.inspections[0].colonyId = 'deleted'
    expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'format' })
  })

  it.each(['2026-02-30', 'not-a-date', null, 42])('retains structurally safe invalid-dated Inspections: %j', (date) => {
    const backup = JSON.parse(validPayload())
    backup.data.inspections[0].date = date
    expect(importData(JSON.stringify(backup))).toMatchObject({
      ok: true, data: { inspections: [{ id: 'i1', date }] },
    })
  })
})
