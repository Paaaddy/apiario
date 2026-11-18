import { MAX_LEGACY_SEEDED_COLONIES, MAX_IMPORTED_COLONIES, MAX_COLONY_NAME_LENGTH, MAX_COLONY_NOTES_LENGTH } from './backupLimits'
import { MAX_TASK_LOG_ENTRIES } from './retentionLimits'
import { loadStoredValue } from './storageEngine'

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

const acceptsInspections = (value) => uniqueRecords(value, isInspection)
const acceptsLog = (value) => uniqueRecords(value, (entry) => isLogEntry(entry, true))
export const capLog = (log) => (log.length > MAX_TASK_LOG_ENTRIES ? log.slice(0, MAX_TASK_LOG_ENTRIES) : log)

/**
 * Every persisted slice of Apiario data, defined once. Hooks, Backup and
 * the debug panel all derive keys, validation and defaults from here.
 * `backupDefault` is what an absent slice contributes to a Backup.
 */
export const SLICES = {
  profile: {
    key: 'apiario-profile',
    fallback: DEFAULT_PROFILE,
    backupDefault: {},
    isCollection: false,
    accepts: isProfile,
    normalize: normalizeProfile,
  },
  inspections: {
    key: 'apiario-inspections',
    fallback: [],
    backupDefault: [],
    isCollection: true,
    accepts: acceptsInspections,
    normalize: (value) => value,
  },
  log: {
    key: 'apiario-log',
    fallback: [],
    backupDefault: [],
    isCollection: true,
    accepts: acceptsLog,
    normalize: capLog,
  },
}

export function loadSlice(slice) {
  return loadStoredValue(slice.key, slice.fallback, slice.accepts, slice.normalize)
}
