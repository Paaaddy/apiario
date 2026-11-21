import { afterEach } from 'vitest'
import {
  INSPECTION_SCHEMA_VERSION, LOG_SCHEMA_VERSION, SLICES, loadSlice, migrateInspection, migrateLogEntry,
} from './persistedSlices'
import { exportData, importData, restoreBackup } from './backupFormat'
import {
  SHIPPED_INSPECTIONS, SHIPPED_LOG, SHIPPED_PROFILE, INSPECTION_V2_0_0, LOG_CUSTOM_V1_0_0, stampedAt,
} from './shippedRecordShapes.fixtures'

const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'
const v1 = stampedAt(1)

afterEach(() => localStorage.clear())

function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function unversionedEnvelope() {
  const backup = legacyBackup()
  delete backup.schemaVersion
  return backup
}

function legacyBackup(overrides = {}) {
  return {
    format: 'apiario-backup',
    schemaVersion: 2,
    exportedAt: '2026-10-01T00:00:00.000Z',
    data: { profile: SHIPPED_PROFILE, inspections: SHIPPED_INSPECTIONS, log: SHIPPED_LOG },
    ...overrides,
  }
}

describe('record schema versions', () => {
  it('starts both collections at version 1', () => {
    expect(INSPECTION_SCHEMA_VERSION).toBe(1)
    expect(LOG_SCHEMA_VERSION).toBe(1)
  })

  describe('migrating one record', () => {
    it.each(SHIPPED_INSPECTIONS)('stamps a shipped Inspection without changing an observation: $id', (record) => {
      expect(migrateInspection(record)).toEqual({ ...record, schemaVersion: 1 })
    })

    it.each(SHIPPED_LOG)('stamps a shipped task-log entry without changing it: $id', (entry) => {
      expect(migrateLogEntry(entry)).toEqual({ ...entry, schemaVersion: 1 })
    })

    it('is idempotent and never mutates its input', () => {
      const original = structuredClone(INSPECTION_V2_0_0)
      const once = migrateInspection(INSPECTION_V2_0_0)
      expect(migrateInspection(once)).toEqual(once)
      expect(INSPECTION_V2_0_0).toEqual(original)
    })

    it('leaves a record from a newer version untouched', () => {
      expect(migrateInspection({ id: 'x', schemaVersion: 99, futureField: 1 })).toEqual({ id: 'x', schemaVersion: 99, futureField: 1 })
    })
  })

  describe('loading a collection written by a shipped build', () => {
    it('migrates an unversioned Inspection journal in memory and leaves storage as it was', () => {
      store(INSPECTIONS_KEY, SHIPPED_INSPECTIONS)
      const raw = localStorage.getItem(INSPECTIONS_KEY)
      expect(loadSlice(SLICES.inspections)).toMatchObject({ value: SHIPPED_INSPECTIONS.map(v1), unsafe: false })
      expect(localStorage.getItem(INSPECTIONS_KEY)).toBe(raw)
    })

    it('migrates an unversioned task log', () => {
      store(LOG_KEY, SHIPPED_LOG)
      expect(loadSlice(SLICES.log)).toMatchObject({ value: SHIPPED_LOG.map(v1), unsafe: false })
    })

    it('reads a bare array whose records an older build carried over from a new Backup', () => {
      // 2.8.0 restores a new Backup as bare arrays of stamped records.
      store(INSPECTIONS_KEY, SHIPPED_INSPECTIONS.map(v1))
      expect(loadSlice(SLICES.inspections)).toMatchObject({ value: SHIPPED_INSPECTIONS.map(v1), unsafe: false })
    })

    it('reads a version-1 collection written by this build', () => {
      store(INSPECTIONS_KEY, { schemaVersion: 1, records: SHIPPED_INSPECTIONS.map(v1) })
      store(LOG_KEY, { schemaVersion: 1, records: SHIPPED_LOG.map(v1) })
      expect(loadSlice(SLICES.inspections)).toMatchObject({ value: SHIPPED_INSPECTIONS.map(v1), unsafe: false })
      expect(loadSlice(SLICES.log)).toMatchObject({ value: SHIPPED_LOG.map(v1), unsafe: false })
    })

    it('migrates unversioned records found inside a version-1 collection', () => {
      store(INSPECTIONS_KEY, { schemaVersion: 1, records: [INSPECTION_V2_0_0] })
      expect(loadSlice(SLICES.inspections)).toMatchObject({ value: [v1(INSPECTION_V2_0_0)], unsafe: false })
    })
  })

  describe('refusing what this build cannot read', () => {
    it.each([2, 99])('refuses a whole collection from version %i by name and leaves it untouched', (version) => {
      store(INSPECTIONS_KEY, { schemaVersion: version, records: SHIPPED_INSPECTIONS, shapeOnlyItKnows: true })
      const raw = localStorage.getItem(INSPECTIONS_KEY)
      expect(loadSlice(SLICES.inspections)).toMatchObject({ value: [], unsafe: true, messageKey: 'storage_newer_version' })
      expect(localStorage.getItem(INSPECTIONS_KEY)).toBe(raw)
    })

    it('shows readable records read-only and hides a record from a newer version', () => {
      const future = { id: 'from-the-future', colonyId: 'col-1', schemaVersion: 99, varroaSample: { mites: 3 } }
      store(LOG_KEY, [LOG_CUSTOM_V1_0_0])
      store(INSPECTIONS_KEY, { schemaVersion: 1, records: [v1(INSPECTION_V2_0_0), future] })
      expect(loadSlice(SLICES.inspections)).toMatchObject({
        value: [v1(INSPECTION_V2_0_0)], unsafe: true, messageKey: 'storage_newer_version',
      })
      expect(loadSlice(SLICES.log)).toMatchObject({ unsafe: false })
    })

    it.each([
      ['a record version that is not a whole number', [{ ...INSPECTION_V2_0_0, schemaVersion: '1' }]],
      ['a negative record version', [{ ...INSPECTION_V2_0_0, schemaVersion: -1 }]],
      ['a null record version', [{ ...INSPECTION_V2_0_0, schemaVersion: null }]],
      ['a container claiming version 0', { schemaVersion: 0, records: [INSPECTION_V2_0_0] }],
      ['a container without records', { schemaVersion: 1 }],
      ['a container with an unknown field', { schemaVersion: 1, records: [INSPECTION_V2_0_0], extra: true }],
      ['a container with a fractional version', { schemaVersion: 1.5, records: [INSPECTION_V2_0_0] }],
    ])('treats %s as damaged, not as a newer version', (_, stored) => {
      store(INSPECTIONS_KEY, stored)
      const loaded = loadSlice(SLICES.inspections)
      expect(loaded.unsafe).toBe(true)
      expect(loaded.messageKey).toBe('storage_invalid')
    })
  })

  describe('ordinary writes', () => {
    it('accepts only current-version records in memory', () => {
      expect(SLICES.inspections.accepts([v1(INSPECTION_V2_0_0)])).toBe(true)
      expect(SLICES.inspections.accepts([INSPECTION_V2_0_0])).toBe(false)
      expect(SLICES.inspections.accepts([{ ...INSPECTION_V2_0_0, schemaVersion: 2 }])).toBe(false)
      expect(SLICES.log.accepts(SHIPPED_LOG.map(v1))).toBe(true)
    })

    it('stores the collection with its own version around the records', () => {
      expect(SLICES.log.encode([v1(LOG_CUSTOM_V1_0_0)])).toEqual({ schemaVersion: 1, records: [v1(LOG_CUSTOM_V1_0_0)] })
    })
  })

  describe('Backup', () => {
    it('exports an unversioned journal at the current version, recording every version', () => {
      store('apiario-profile', SHIPPED_PROFILE)
      store(INSPECTIONS_KEY, SHIPPED_INSPECTIONS)
      store(LOG_KEY, { schemaVersion: 1, records: SHIPPED_LOG.map(v1) })
      const backup = exportData()
      expect(backup).toMatchObject({
        format: 'apiario-backup',
        schemaVersion: 2,
        collectionSchemaVersions: { inspections: 1, log: 1 },
        data: { profile: SHIPPED_PROFILE, inspections: SHIPPED_INSPECTIONS.map(v1), log: SHIPPED_LOG.map(v1) },
      })
    })

    it('keeps the collections as arrays, the shape 2.8.0 and earlier restore', () => {
      store(INSPECTIONS_KEY, SHIPPED_INSPECTIONS)
      const backup = exportData()
      expect(Array.isArray(backup.data.inspections)).toBe(true)
      expect(Array.isArray(backup.data.log)).toBe(true)
      expect(backup.schemaVersion).toBe(2)
    })

    it('exports data this build cannot read unchanged instead of dropping it', () => {
      const future = { schemaVersion: 7, records: [{ id: 'f', colonyId: 'col-1', schemaVersion: 7 }] }
      store(INSPECTIONS_KEY, future)
      const backup = exportData()
      expect(backup.data.inspections).toEqual(future.records)
      expect(backup.collectionSchemaVersions.inspections).toBe(7)
      expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'newer' })
    })

    it('round-trips a new Backup into the new build with every version recorded', () => {
      store('apiario-profile', SHIPPED_PROFILE)
      store(INSPECTIONS_KEY, SHIPPED_INSPECTIONS)
      store(LOG_KEY, SHIPPED_LOG)
      const raw = JSON.stringify(exportData())
      localStorage.clear()
      expect(restoreBackup(raw)).toMatchObject({ ok: true, requiresReload: true })
      expect(JSON.parse(localStorage.getItem(INSPECTIONS_KEY))).toEqual({ schemaVersion: 1, records: SHIPPED_INSPECTIONS.map(v1) })
      expect(JSON.parse(localStorage.getItem(LOG_KEY))).toEqual({ schemaVersion: 1, records: SHIPPED_LOG.map(v1) })
      expect(loadSlice(SLICES.inspections)).toMatchObject({ value: SHIPPED_INSPECTIONS.map(v1), unsafe: false })
      expect(loadSlice(SLICES.log)).toMatchObject({ value: SHIPPED_LOG.map(v1), unsafe: false })
    })

    it.each([
      ['a 2.8.0 Backup (envelope 2, no collection versions)', legacyBackup()],
      ['an envelope-1 Backup', legacyBackup({ schemaVersion: 1 })],
      ['an unversioned envelope', unversionedEnvelope()],
    ])('restores %s and stores it migrated', (_, backup) => {
      expect(restoreBackup(JSON.stringify(backup))).toMatchObject({ ok: true })
      expect(JSON.parse(localStorage.getItem(INSPECTIONS_KEY))).toEqual({ schemaVersion: 1, records: SHIPPED_INSPECTIONS.map(v1) })
      expect(JSON.parse(localStorage.getItem(LOG_KEY))).toEqual({ schemaVersion: 1, records: SHIPPED_LOG.map(v1) })
    })

    it.each([
      ['an Inspection collection', { collectionSchemaVersions: { inspections: 99, log: 1 } }],
      ['a task log', { collectionSchemaVersions: { inspections: 1, log: 2 } }],
    ])('refuses %s from a newer version with a clear message and replaces nothing', (_, overrides) => {
      store(INSPECTIONS_KEY, [INSPECTION_V2_0_0])
      const before = localStorage.getItem(INSPECTIONS_KEY)
      expect(restoreBackup(JSON.stringify(legacyBackup(overrides)))).toMatchObject({
        ok: false, error: 'newer', messageKey: 'data_import_error_newer', requiresReload: false,
      })
      expect(localStorage.getItem(INSPECTIONS_KEY)).toBe(before)
      expect(localStorage.getItem(LOG_KEY)).toBeNull()
    })

    it('refuses a Backup holding one record from a newer version', () => {
      const backup = legacyBackup({ collectionSchemaVersions: { inspections: 1, log: 1 } })
      backup.data.inspections = [...SHIPPED_INSPECTIONS.map(v1), { id: 'new', colonyId: 'col-1', schemaVersion: 2 }]
      expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'newer' })
    })

    it.each([null, [], 'v1', { inspections: '1' }, { log: -1 }, { inspections: 1.5 }])(
      'rejects malformed collection versions as a format error: %j',
      (collectionSchemaVersions) => {
        expect(importData(JSON.stringify(legacyBackup({ collectionSchemaVersions }))))
          .toMatchObject({ ok: false, error: 'format', messageKey: 'data_import_error_format' })
      },
    )

    it('ignores versions for collections this build does not know', () => {
      const backup = legacyBackup({ collectionSchemaVersions: { inspections: 1, log: 1, weights: 4 } })
      expect(importData(JSON.stringify(backup))).toMatchObject({ ok: true })
    })

    it('still applies the record rules after migration', () => {
      const backup = legacyBackup()
      backup.data.inspections = [{ ...INSPECTION_V2_0_0, varroa: -1 }]
      expect(importData(JSON.stringify(backup))).toMatchObject({ ok: false, error: 'format' })
    })
  })
})
