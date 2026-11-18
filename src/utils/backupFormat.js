import { MAX_BACKUP_BYTES, MAX_IMPORTED_COLONIES } from './backupLimits'
import { MAX_INSPECTIONS_PER_COLONY, MAX_TASK_LOG_ENTRIES } from './retentionLimits'
import { SLICES, isRecord, isProfile, isInspection, isLogEntry, uniqueRecords, migrateProfile } from './persistedSlices'
import {
  hasStorageRecovery, subscribeStorageRecovery, writeStorageTransaction, recoverStorageTransaction,
} from './storageEngine'

const SLICE_ENTRIES = Object.entries(SLICES)

export function hasValidBackupRecords({ profile, inspections, log }) {
  if (!isProfile(profile) || log.length > MAX_TASK_LOG_ENTRIES ||
    !uniqueRecords(inspections, isInspection) || !uniqueRecords(log, isLogEntry)) return false
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
const SCHEMA_VERSION = 2

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
  }[error] ?? BACKUP_MESSAGE_KEYS.unexpectedError
  return { ok: false, error, messageKey, requiresReload: false }
}

export function buildBackup() {
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(SLICE_ENTRIES.map(([name, slice]) => [name, readJSON(slice.key, slice.backupDefault)])),
  }
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
    if (!isRecord(parsed) || parsed.format !== FORMAT || !hasValidSlices(parsed.data) ||
      (Object.hasOwn(parsed, 'schemaVersion') && ![1, SCHEMA_VERSION].includes(parsed.schemaVersion))) {
      return backupErrorOutcome('format')
    }
    const data = normalizeBackupData(parsed.data)
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
    SLICE_ENTRIES.map(([name, slice]) => [slice.key, result.data[name]]),
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
