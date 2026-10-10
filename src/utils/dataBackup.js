import { hasValidBackupRecords } from './backupValidation'
import { MAX_BACKUP_BYTES } from './backupLimits'
import { hasStorageRecovery, subscribeStorageRecovery, recoverStorageTransaction, writeStorageTransaction } from './storageTransaction'

const PROFILE_KEY = 'apiario-profile'
const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'

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
  return {
    profile: data.profile ?? {},
    inspections: Array.isArray(data.inspections) ? data.inspections : [],
    log: Array.isArray(data.log) ? data.log : [],
  }
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function hasValidSlices(data) {
  return isRecord(data) &&
    (!Object.hasOwn(data, 'profile') || isRecord(data.profile)) &&
    (!Object.hasOwn(data, 'inspections') || Array.isArray(data.inspections)) &&
    (!Object.hasOwn(data, 'log') || Array.isArray(data.log))
}

export function backupErrorOutcome(error) {
  const messageKey = {
    recovery: BACKUP_MESSAGE_KEYS.recoveryError,
    size: BACKUP_MESSAGE_KEYS.sizeError,
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
    data: {
      profile: readJSON(PROFILE_KEY, {}),
      inspections: readJSON(INSPECTIONS_KEY, []),
      log: readJSON(LOG_KEY, []),
    },
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

  const outcome = writeStorageTransaction([
    [PROFILE_KEY, result.data.profile],
    [INSPECTIONS_KEY, result.data.inspections],
    [LOG_KEY, result.data.log],
  ], 'backup')
  if (!outcome.ok) return backupErrorOutcome(outcome.error === 'recovery' ? 'recovery' : 'unexpected')

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

export function exportBackupOutcome(data = buildBackup()) {
  return {
    ok: true,
    data,
    messageKey: BACKUP_MESSAGE_KEYS.exported,
    requiresReload: false,
  }
}
