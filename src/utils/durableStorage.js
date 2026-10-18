export const PROFILE_SCHEMA_VERSION = 3

function maxColonyNumericId(existing) {
  let max = 0
  for (const colony of existing) {
    const match = /^col-(\d+)$/.exec(colony.id ?? '')
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return max
}

export function nextColonyId(existing) {
  return `col-${maxColonyNumericId(existing) + 1}`
}

export function buildSeededColonies(count, existing = []) {
  const colonies = existing ?? []
  const remaining = Math.max(0, Number(count) || 0) - colonies.length
  if (remaining <= 0) return colonies
  const createdAt = new Date().toISOString().split('T')[0]
  const start = maxColonyNumericId(colonies)
  return [
    ...colonies,
    ...Array.from({ length: remaining }, (_, index) => ({
      id: `col-${start + index + 1}`,
      name: `Hive ${start + index + 1}`,
      createdAt,
      notes: '',
      queenIntroducedAt: null,
      harvestLog: [],
    })),
  ]
}

/** Shared by loading and Backup validation; preserves established migrations. */
export function migrateProfile(profile) {
  const migrated = { ...profile }
  const version = migrated.schemaVersion ?? 0
  if (version < 2) migrated.colonies = buildSeededColonies(migrated.hiveCount)
  if (version < 3) {
    if (Array.isArray(migrated.colonies)) {
      migrated.colonies = migrated.colonies.map((colony) => ({
        ...colony,
        queenIntroducedAt: colony.queenIntroducedAt ?? null,
        harvestLog: colony.harvestLog ?? [],
      }))
    }
    migrated.schemaVersion = PROFILE_SCHEMA_VERSION
  }
  return migrated
}


export const STORED_VALUE = Symbol('validated stored value')
function storedValue(value, unsafe) { return { [STORED_VALUE]: true, value, unsafe } }

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function isId(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function optionalFields(record, fields, accepts) {
  return fields.every((field) => record[field] == null || accepts(record[field]))
}

function isText(value) {
  return typeof value === 'string'
}

function isTranslatedText(value) {
  return isText(value) || (isRecord(value) && isText(value.de) && isText(value.en))
}

function isNonnegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function uniqueRecords(records, accepts) {
  if (!Array.isArray(records)) return false
  const ids = new Set()
  for (const record of records) {
    if (!isRecord(record) || !isId(record.id) || ids.has(record.id) || !accepts(record)) return false
    ids.add(record.id)
  }
  return true
}

function isColony(colony) {
  return isText(colony.name) &&
    optionalFields(colony, ['notes', 'createdAt', 'queenIntroducedAt'], isText) &&
    (colony.harvestLog == null || (Array.isArray(colony.harvestLog) && colony.harvestLog.every(isRecord)))
}

export function isProfile(profile) {
  return isRecord(profile) &&
    (!Object.hasOwn(profile, 'schemaVersion') || (Number.isInteger(profile.schemaVersion) && profile.schemaVersion >= 0 && profile.schemaVersion <= PROFILE_SCHEMA_VERSION)) &&
    optionalFields(profile, ['hiveCount'], (value) => Number.isSafeInteger(value) && value >= 0) &&
    ((profile.schemaVersion ?? 0) >= 2 || (profile.hiveCount ?? 0) <= MAX_LEGACY_SEEDED_COLONIES) &&
    optionalFields(profile, ['experience'], (value) => [0, 1, 2].includes(value)) &&
    optionalFields(profile, ['climateZone'], (value) => ['northern', 'central', 'mediterranean', 'other'].includes(value)) &&
    (!Object.hasOwn(profile, 'onboardingDone') || typeof profile.onboardingDone === 'boolean') &&
    (!Object.hasOwn(profile, 'colonies') || uniqueRecords(profile.colonies, isColony))
}

export function isInspection(inspection) {
  return isId(inspection.colonyId) &&
    optionalFields(inspection, ['queenStatus'], (value) => ['seen', 'eggs', 'larvae', 'not_seen'].includes(value)) &&
    optionalFields(inspection, ['temperament'], (value) => ['calm', 'normal', 'defensive'].includes(value)) &&
    optionalFields(inspection, ['broodPattern', 'honeyStores', 'population'], (value) => Number.isInteger(value) && value >= 0 && value <= 5) &&
    optionalFields(inspection, ['varroa', 'harvest'], isNonnegativeNumber) &&
    optionalFields(inspection, ['notes', 'treatment', 'createdAt', 'queenYear'], isText) &&
    // Invalid calendar dates are retained by the Inspection chronology contract.
    // Object-valued dates are unsafe to render; missing/null/primitive dates are not.
    optionalFields(inspection, ['date'], (value) => isText(value) || typeof value === 'number' || typeof value === 'boolean')
}

export function isLogEntry(entry, allowMissingTaskName = false) {
  if (!optionalFields(entry, ['date', 'completedAt'], isText)) return false
  if (entry.type === 'custom') {
    return isText(entry.text)
  }
  if (entry.type === 'task') {
    return isId(entry.taskId) && (isTranslatedText(entry.taskName) || (allowMissingTaskName && entry.taskName == null))
  }
  return false
}

// Unsafe data stays untouched on disk. Loading is tolerant of chronology, not
// unsafe record structure; Backup adds ownership and retention checks separately.
export function loadStoredValue(key, fallback, accepts, normalize = (value) => value) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return storedValue(fallback, false)
    const parsed = JSON.parse(raw)
    if (!accepts(parsed)) {
      // A read-only projection keeps sound records visible without replacing
      // the original collection. Never persist this filtered projection.
      const seen = new Set()
      const value = Array.isArray(parsed) && Array.isArray(fallback)
        ? parsed.filter((record) => {
            if (!accepts([record]) || seen.has(record.id)) return false
            seen.add(record.id)
            return true
          })
        : fallback
      return storedValue(value, true)
    }
    return storedValue(normalize(parsed), false)
  } catch {
    return storedValue(fallback, true)
  }
}


export function hasValidBackupRecords({ profile, inspections, log }) {
  if (!isProfile(profile) || log.length > MAX_TASK_LOG_ENTRIES ||
    !uniqueRecords(inspections, isInspection) || !uniqueRecords(log, isLogEntry)) return false
  const colonyIds = new Set((migrateProfile(profile).colonies ?? []).map((colony) => colony.id))
  const counts = new Map()
  return inspections.every((inspection) => {
    const count = (counts.get(inspection.colonyId) ?? 0) + 1
    counts.set(inspection.colonyId, count)
    return colonyIds.has(inspection.colonyId) && count <= MAX_INSPECTIONS_PER_COLONY
  })
}

import { protectReload } from '../pwa/reloadSafety'
import { MAX_LEGACY_SEEDED_COLONIES, MAX_BACKUP_BYTES } from './backupLimits'
import { MAX_INSPECTIONS_PER_COLONY, MAX_TASK_LOG_ENTRIES } from './retentionLimits'
// Shared by Backup replacement and related ordinary changes. Exact raw strings
// survive rollback; this session-only recovery is not a crash-safe transaction.
let recovery = null
const listeners = new Set()
const recoveryToken = {}

export function hasStorageRecovery() { return recovery !== null }
export function getRecoveryCause() { return recovery?.cause ?? null }
export function subscribeStorageRecovery(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setRecovery(value) {
  recovery = value
  protectReload(recoveryToken, value !== null)
  listeners.forEach((listener) => listener())
}

function restoreSnapshot(snapshot) {
  let failed = false
  for (const [key, previous] of snapshot) {
    try {
      if (previous === null) localStorage.removeItem(key)
      else localStorage.setItem(key, previous)
    } catch {
      failed = true
    }
  }
  return !failed
}

export function writeStorageTransaction(entries, cause = 'mutation') {
  if (hasStorageRecovery()) return { ok: false, error: 'recovery' }
  let snapshot, prepared
  try {
    snapshot = entries.map(([key]) => [key, localStorage.getItem(key)])
    prepared = entries.map(([, value]) => JSON.stringify(value))
  } catch {
    return { ok: false, error: 'storage' }
  }
  const written = []
  try {
    entries.forEach(([key], index) => {
      localStorage.setItem(key, prepared[index])
      written.push(snapshot[index])
    })
  } catch {
    written.reverse()
    if (!restoreSnapshot(written)) {
      setRecovery({ snapshot: written, cause })
      return { ok: false, error: 'recovery' }
    }
    return { ok: false, error: 'storage' }
  }
  return { ok: true }
}

export function recoverStorageTransaction() {
  if (!recovery) return { ok: false, error: 'storage' }
  if (!restoreSnapshot(recovery.snapshot)) return { ok: false, error: 'recovery' }
  setRecovery(null)
  return { ok: true }
}


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
