import { MAX_BACKUP_BYTES, MAX_IMPORTED_COLONIES } from './backupLimits'
import { MAX_INSPECTIONS_PER_COLONY } from './retentionLimits'
import { NEWER_VERSION, SLICES, isRecord, isSchemaVersion, migrateProfile } from './persistedSlices'
import {
  hasStorageRecovery, subscribeStorageRecovery, writeStorageTransaction, recoverStorageTransaction,
} from './storageEngine'

const SLICE_ENTRIES = Object.entries(SLICES)
const COLLECTION_ENTRIES = SLICE_ENTRIES.filter(([, slice]) => slice.isCollection)

// A Backup is stricter than a load: over-cap collections are rejected, not truncated.
export function hasValidBackupRecords(data) {
  const withinCaps = SLICE_ENTRIES.every(([name, slice]) =>
    slice.accepts(data[name]) && (slice.maxRecords == null || data[name].length <= slice.maxRecords))
  if (!withinCaps) return false
  const { profile, inspections } = data
  const migratedColonies = migrateProfile(profile).colonies ?? []
  if (!Array.isArray(migratedColonies) || migratedColonies.length > MAX_IMPORTED_COLONIES) return false
  const colonyIds = new Set(migratedColonies.map((colony) => colony.id))
  const counts = new Map()
  return inspections.every((inspection) => {
    const count = (counts.get(inspection.colonyId) ?? 0) + 1
    counts.set(inspection.colonyId, count)
    return colonyIds.has(inspection.colonyId) && count <= MAX_INSPECTIONS_PER_COLONY
  })
}


const FORMAT = 'apiario-backup'
// The envelope keeps version 2: collection versions are an additive field and
// the collections stay arrays, so 2.8.0 and earlier still restore a new Backup
// (they ignore the stamps, and v1 records are v0 records plus the stamp).
// Builds up to 2.8.0 do not check record versions, so the first collection
// version a v1-era reader would mis-read must also bump this envelope version.
export const SCHEMA_VERSION = 2

export const hasBackupRecovery = hasStorageRecovery
export const subscribeBackupRecovery = subscribeStorageRecovery

export const BACKUP_MESSAGE_KEYS = {
  exported: 'data_exported',
  importReload: 'data_import_reload',
  parseError: 'data_import_error_parse',
  formatError: 'data_import_error_format',
  unexpectedError: 'data_import_error_unexpected',
  recoveryError: 'data_import_error_recovery',
  sizeError: 'data_import_error_size',
  newerError: 'data_import_error_newer',
  storageError: 'storage_error',
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function normalizeBackupData(data) {
  return Object.fromEntries(SLICE_ENTRIES.map(([name, slice]) => [
    name,
    slice.isCollection
      ? (Array.isArray(data[name]) ? data[name] : slice.backupDefault)
      : (data[name] ?? slice.backupDefault),
  ]))
}

function hasValidSlices(data) {
  return isRecord(data) && SLICE_ENTRIES.every(([name, slice]) =>
    !Object.hasOwn(data, name) || (slice.isCollection ? Array.isArray(data[name]) : isRecord(data[name])))
}

export function backupErrorOutcome(error) {
  const messageKey = {
    recovery: BACKUP_MESSAGE_KEYS.recoveryError,
    size: BACKUP_MESSAGE_KEYS.sizeError,
    storage: BACKUP_MESSAGE_KEYS.storageError,
    parse: BACKUP_MESSAGE_KEYS.parseError,
    format: BACKUP_MESSAGE_KEYS.formatError,
    [NEWER_VERSION]: BACKUP_MESSAGE_KEYS.newerError,
  }[error] ?? BACKUP_MESSAGE_KEYS.unexpectedError
  return { ok: false, error, messageKey, requiresReload: false }
}

// Exports a stored collection at the current version. Data this build cannot
// read is exported unchanged, never dropped, so the Backup keeps every byte.
function exportCollection(slice) {
  const stored = readJSON(slice.key, null)
  if (stored === null) return { schemaVersion: slice.schemaVersion, records: slice.backupDefault }
  const container = slice.unwrap(stored)
  if (container === null) return { schemaVersion: null, records: stored }
  if (container.schemaVersion > slice.schemaVersion) {
    return { schemaVersion: container.schemaVersion, records: container.records ?? stored }
  }
  return { schemaVersion: slice.schemaVersion, records: container.records.map(slice.exportRecord) }
}

export function buildBackup() {
  const data = {}
  const collectionSchemaVersions = {}
  for (const [name, slice] of SLICE_ENTRIES) {
    if (!slice.isCollection) {
      data[name] = readJSON(slice.key, slice.backupDefault)
      continue
    }
    const exported = exportCollection(slice)
    data[name] = exported.records
    if (exported.schemaVersion !== null) collectionSchemaVersions[name] = exported.schemaVersion
  }
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    collectionSchemaVersions,
    data,
  }
}

// Version of each collection in a Backup; absent means version 0, as every
// Backup written before versioning. Null when the field is malformed.
function collectionVersionsOf(parsed) {
  if (!Object.hasOwn(parsed, 'collectionSchemaVersions')) {
    return Object.fromEntries(COLLECTION_ENTRIES.map(([name]) => [name, 0]))
  }
  const declared = parsed.collectionSchemaVersions
  if (!isRecord(declared)) return null
  const versions = {}
  for (const [name] of COLLECTION_ENTRIES) {
    if (!Object.hasOwn(declared, name)) versions[name] = 0
    else if (isSchemaVersion(declared[name])) versions[name] = declared[name]
    else return null
  }
  return versions
}

// Migrates every collection of normalized Backup data to the current version.
function decodeBackupCollections(data, versions) {
  const decoded = { ...data }
  for (const [name, slice] of COLLECTION_ENTRIES) {
    const outcome = slice.decode({ schemaVersion: versions[name], records: data[name] })
    if (!outcome.ok) return { ok: false, error: outcome.reason === NEWER_VERSION ? NEWER_VERSION : 'format' }
    decoded[name] = outcome.records
  }
  return { ok: true, data: decoded }
}

export function parseBackup(raw) {
  try {
    if (typeof raw !== 'string') return backupErrorOutcome('parse')
    if (raw.length > MAX_BACKUP_BYTES || new Blob([raw]).size > MAX_BACKUP_BYTES) return backupErrorOutcome('size')
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return backupErrorOutcome('parse')
    }
    if (!isRecord(parsed) || parsed.format !== FORMAT) return backupErrorOutcome('format')
    const hasEnvelopeVersion = Object.hasOwn(parsed, 'schemaVersion')
    // A newer build's Backup is refused by name, before its shape is judged.
    if (hasEnvelopeVersion && isSchemaVersion(parsed.schemaVersion) && parsed.schemaVersion > SCHEMA_VERSION) {
      return backupErrorOutcome(NEWER_VERSION)
    }
    const versions = collectionVersionsOf(parsed)
    if ((hasEnvelopeVersion && ![1, SCHEMA_VERSION].includes(parsed.schemaVersion)) || versions === null) {
      return backupErrorOutcome('format')
    }
    if (COLLECTION_ENTRIES.some(([name, slice]) => versions[name] > slice.schemaVersion)) {
      return backupErrorOutcome(NEWER_VERSION)
    }
    if (!hasValidSlices(parsed.data)) return backupErrorOutcome('format')
    const decoded = decodeBackupCollections(normalizeBackupData(parsed.data), versions)
    if (!decoded.ok) return backupErrorOutcome(decoded.error)
    const { data } = decoded
    if (!hasValidBackupRecords(data)) return backupErrorOutcome('format')
    return {
      ok: true,
      data,
      messageKey: BACKUP_MESSAGE_KEYS.importReload,
      requiresReload: true,
    }
  } catch {
    return backupErrorOutcome('unexpected')
  }
}

export function restoreBackup(raw) {
  if (hasBackupRecovery()) return backupErrorOutcome('recovery')
  const result = parseBackup(raw)
  if (!result.ok) return result

  const outcome = writeStorageTransaction(
    SLICE_ENTRIES.map(([name, slice]) => [slice.key, slice.encode(result.data[name])]),
    'backup'
  )
  if (!outcome.ok) return backupErrorOutcome(outcome.error === 'recovery' ? 'recovery' : outcome.error === 'storage' ? 'storage' : 'unexpected')

  return {
    ok: true,
    data: result.data,
    messageKey: BACKUP_MESSAGE_KEYS.importReload,
    requiresReload: true,
  }
}

export function recoverBackup() {
  if (!hasBackupRecovery()) return backupErrorOutcome('unexpected')
  if (!recoverStorageTransaction().ok) return backupErrorOutcome('recovery')
  return { ok: true, messageKey: 'data_import_recovered', requiresReload: false }
}

export function exportData() {
  return buildBackup()
}

export function importData(raw) {
  return parseBackup(raw)
}

export function exportBackupOutcome(data = buildBackup()) {
  return {
    ok: true,
    data,
    messageKey: BACKUP_MESSAGE_KEYS.exported,
    requiresReload: false,
  }
}
