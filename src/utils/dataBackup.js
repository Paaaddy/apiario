const PROFILE_KEY = 'apiario-profile'
const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'

const FORMAT = 'apiario-backup'
const SCHEMA_VERSION = 2

export const BACKUP_MESSAGE_KEYS = {
  exported: 'data_exported',
  importReload: 'data_import_reload',
  parseError: 'data_import_error_parse',
  formatError: 'data_import_error_format',
  unexpectedError: 'data_import_error_unexpected',
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

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function normalizeBackupData(data) {
  return {
    profile: data.profile ?? {},
    inspections: Array.isArray(data.inspections) ? data.inspections : [],
    log: Array.isArray(data.log) ? data.log : [],
  }
}

function errorOutcome(error) {
  const messageKey =
    error === 'parse'
      ? BACKUP_MESSAGE_KEYS.parseError
      : error === 'format'
        ? BACKUP_MESSAGE_KEYS.formatError
        : BACKUP_MESSAGE_KEYS.unexpectedError
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
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return errorOutcome('parse')
    }
    if (!parsed || parsed.format !== FORMAT || !parsed.data) {
      return errorOutcome('format')
    }
    return {
      ok: true,
      data: normalizeBackupData(parsed.data),
      messageKey: BACKUP_MESSAGE_KEYS.importReload,
      requiresReload: true,
    }
  } catch {
    return errorOutcome('unexpected')
  }
}

export function restoreBackup(raw) {
  const result = parseBackup(raw)
  if (!result.ok) return result

  const writes = [
    safeSet(PROFILE_KEY, result.data.profile),
    safeSet(INSPECTIONS_KEY, result.data.inspections),
    safeSet(LOG_KEY, result.data.log),
  ]

  if (!writes.every(Boolean)) return errorOutcome('unexpected')

  return {
    ok: true,
    data: result.data,
    messageKey: BACKUP_MESSAGE_KEYS.importReload,
    requiresReload: true,
  }
}

export function exportBackupOutcome(data = buildBackup()) {
  return {
    ok: true,
    data,
    messageKey: BACKUP_MESSAGE_KEYS.exported,
    requiresReload: false,
  }
}
