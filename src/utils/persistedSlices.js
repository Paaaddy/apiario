import { MAX_LEGACY_SEEDED_COLONIES, MAX_IMPORTED_COLONIES, MAX_COLONY_NAME_LENGTH, MAX_COLONY_NOTES_LENGTH } from './backupLimits'
import { MAX_TASK_LOG_ENTRIES } from './retentionLimits'
import { loadStoredCollection, loadStoredValue } from './storageEngine'

export const PROFILE_SCHEMA_VERSION = 3
// Every Inspection and task-log entry carries its own version, and so does the
// stored collection holding them. Everything written before versioning
// existed (Apiario 2.8.0 and earlier) is version 0.
export const INSPECTION_SCHEMA_VERSION = 1
export const LOG_SCHEMA_VERSION = 1

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
  if (version < 2) migrated.colonies = buildSeededColonies(migrated.hiveCount, migrated.colonies)
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

/**
 * Brings one stored Inspection to the current version. Shared by loading,
 * Backup export and Backup restore. A migration step runs before validation,
 * so it must not throw on any JSON object and must never invent observations.
 */
export function migrateInspection(inspection) {
  const migrated = { ...inspection }
  const version = migrated.schemaVersion ?? 0
  // v0 -> v1: every shape shipped before versioning (2.0.0 to 2.8.0) is
  // already the v1 shape; versioning adds only the stamp.
  if (version < 1) migrated.schemaVersion = INSPECTION_SCHEMA_VERSION
  return migrated
}

/** Brings one stored task-log entry to the current version, like `migrateInspection`. */
export function migrateLogEntry(entry) {
  const migrated = { ...entry }
  const version = migrated.schemaVersion ?? 0
  // v0 -> v1: task and custom entries keep their shape; versioning adds only
  // the stamp. Entries without a taskName stay readable, as before.
  if (version < 1) migrated.schemaVersion = LOG_SCHEMA_VERSION
  return migrated
}

export function isSchemaVersion(value) {
  return Number.isSafeInteger(value) && value >= 0
}

export function isRecord(value) {
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
    colony.name.length <= MAX_COLONY_NAME_LENGTH &&
    (colony.notes == null || (isText(colony.notes) && colony.notes.length <= MAX_COLONY_NOTES_LENGTH)) &&
    optionalFields(colony, ['createdAt', 'queenIntroducedAt'], isText) &&
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
    (!Object.hasOwn(profile, 'colonies') || (uniqueRecords(profile.colonies, isColony) && profile.colonies.length <= MAX_IMPORTED_COLONIES))
}

export const QUEEN_STATUSES = ['seen', 'eggs', 'larvae', 'not_seen']
export const TEMPERAMENTS = ['calm', 'normal', 'defensive']
export const INSPECTION_SCALE_MAX = 5

export function isScaleValue(value) {
  return Number.isInteger(value) && value >= 0 && value <= INSPECTION_SCALE_MAX
}

export function isNonnegativeFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function isInspection(inspection) {
  return isId(inspection.colonyId) &&
    optionalFields(inspection, ['queenStatus'], (value) => QUEEN_STATUSES.includes(value)) &&
    optionalFields(inspection, ['temperament'], (value) => TEMPERAMENTS.includes(value)) &&
    optionalFields(inspection, ['broodPattern', 'honeyStores', 'population'], isScaleValue) &&
    optionalFields(inspection, ['varroa', 'harvest'], isNonnegativeFiniteNumber) &&
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


export const DEFAULT_PROFILE = {
  schemaVersion: PROFILE_SCHEMA_VERSION,
  hiveCount: null,
  climateZone: null,
  experience: null,
  onboardingDone: false,
  colonies: [],
}

function normalizeProfile(parsed) {
  // Detect the schema version from the PARSED data, not from the
  // merged-with-defaults version: the defaults' schemaVersion would hide
  // the fact that stored data is an older version.
  const storedVersion = parsed.schemaVersion ?? 0
  const migrated = storedVersion === PROFILE_SCHEMA_VERSION ? parsed : migrateProfile(parsed)
  // Fill in any keys that newer schema versions introduced but the stored
  // object never had.
  return { ...DEFAULT_PROFILE, ...migrated }
}

export const capLog = (log) => (log.length > MAX_TASK_LOG_ENTRIES ? log.slice(0, MAX_TASK_LOG_ENTRIES) : log)

export const NEWER_VERSION = 'newer'
export const INVALID_RECORDS = 'invalid'
const COLLECTION_FIELDS = ['schemaVersion', 'records']

function hasKnownVersion(record, current) {
  return !Object.hasOwn(record, 'schemaVersion') ||
    (isSchemaVersion(record.schemaVersion) && record.schemaVersion <= current)
}

/**
 * A collection whose records and container both carry a schema version.
 * In memory a collection is a plain array of current-version records, so the
 * hooks keep their array API; only storage and Backup see the container.
 *
 * Stored forms:
 *   version 0: the bare array every build before versioning wrote
 *   version 1+: `{ schemaVersion, records }`, the version on the stored blob
 *               as the profile has it
 */
function versionedCollection({ schemaVersion, migrate, accepts }) {
  const acceptsCurrent = (record) => record.schemaVersion === schemaVersion && accepts(record)

  /** Stored value -> `{ schemaVersion, records }`, or null when it is neither form. */
  function unwrap(stored) {
    if (Array.isArray(stored)) return { schemaVersion: 0, records: stored }
    if (!isRecord(stored) || !isSchemaVersion(stored.schemaVersion) || stored.schemaVersion < 1) return null
    // A newer build may reshape its container; only its version is trusted.
    if (stored.schemaVersion > schemaVersion) return { schemaVersion: stored.schemaVersion, records: stored.records }
    const exact = Object.keys(stored).every((field) => COLLECTION_FIELDS.includes(field))
    return exact && Array.isArray(stored.records) ? { schemaVersion: stored.schemaVersion, records: stored.records } : null
  }

  /**
   * Checks the collection's version and every record's, migrates each record
   * and validates the result with the current rules. Total for JSON input.
   * `{ ok: true, records }`, or `{ ok: false, reason, sound }` where `sound`
   * holds the records that are safe to show read-only and must never be
   * written back in place of the original collection.
   */
  function decode(container) {
    if (container === null) return { ok: false, reason: INVALID_RECORDS, sound: [] }
    if (container.schemaVersion > schemaVersion) return { ok: false, reason: NEWER_VERSION, sound: [] }
    const sound = []
    const ids = new Set()
    let reason = null
    for (const record of container.records) {
      if (isRecord(record) && Object.hasOwn(record, 'schemaVersion') && isSchemaVersion(record.schemaVersion) &&
        record.schemaVersion > schemaVersion) {
        reason = NEWER_VERSION
        continue
      }
      const readable = isRecord(record) && isId(record.id) && !ids.has(record.id) && hasKnownVersion(record, schemaVersion)
      const migrated = readable ? migrate(record) : null
      if (!migrated || !acceptsCurrent(migrated)) {
        reason ??= INVALID_RECORDS
        continue
      }
      ids.add(migrated.id)
      sound.push(migrated)
    }
    return reason ? { ok: false, reason, sound } : { ok: true, records: sound }
  }

  /** Brings a record to the current version for export; unreadable records stay byte-for-byte. */
  function exportRecord(record) {
    return isRecord(record) && hasKnownVersion(record, schemaVersion) ? migrate(record) : record
  }

  return {
    schemaVersion,
    // Ordinary writes: every in-memory record is current and stamped.
    accepts: (records) => uniqueRecords(records, acceptsCurrent),
    unwrap,
    decode,
    exportRecord,
    encode: (records) => ({ schemaVersion, records }),
  }
}

const inspectionCollection = versionedCollection({
  schemaVersion: INSPECTION_SCHEMA_VERSION,
  migrate: migrateInspection,
  accepts: isInspection,
})

const logCollection = versionedCollection({
  schemaVersion: LOG_SCHEMA_VERSION,
  migrate: migrateLogEntry,
  accepts: (entry) => isLogEntry(entry, true),
})

/**
 * Every persisted slice of Apiario data, defined once. Hooks, Backup and
 * the debug panel all derive keys, validation and defaults from here.
 * `backupDefault` is what an absent slice contributes to a Backup.
 * `accepts` judges the in-memory value an ordinary write would store;
 * `encode` turns that value into its stored form.
 */
export const SLICES = {
  profile: {
    key: 'apiario-profile',
    fallback: DEFAULT_PROFILE,
    backupDefault: {},
    isCollection: false,
    accepts: isProfile,
    normalize: normalizeProfile,
    encode: (value) => value,
  },
  inspections: {
    key: 'apiario-inspections',
    fallback: [],
    backupDefault: [],
    isCollection: true,
    ...inspectionCollection,
    normalize: (value) => value,
  },
  log: {
    key: 'apiario-log',
    fallback: [],
    backupDefault: [],
    isCollection: true,
    ...logCollection,
    normalize: capLog,
    maxRecords: MAX_TASK_LOG_ENTRIES,
  },
}

export const STORAGE_MESSAGE_KEYS = {
  [NEWER_VERSION]: 'storage_newer_version',
  [INVALID_RECORDS]: 'storage_invalid',
}

/** Reads one stored collection; a refusal leaves the stored value untouched. */
function readCollection(slice, stored) {
  const outcome = slice.decode(slice.unwrap(stored))
  if (outcome.ok) return { ok: true, value: slice.normalize(outcome.records) }
  return { ok: false, value: outcome.sound, messageKey: STORAGE_MESSAGE_KEYS[outcome.reason] }
}

export function loadSlice(slice) {
  if (slice.isCollection) return loadStoredCollection(slice.key, (stored) => readCollection(slice, stored))
  return loadStoredValue(slice.key, slice.fallback, slice.accepts, slice.normalize)
}
