import { MAX_LEGACY_SEEDED_COLONIES } from './backupLimits'
import { PROFILE_SCHEMA_VERSION } from './profileMigration'

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
    if (raw === null) return { value: fallback, unsafe: false }
    const parsed = JSON.parse(raw)
    if (!accepts(parsed)) return { value: fallback, unsafe: true }
    return { value: normalize(parsed), unsafe: false }
  } catch {
    return { value: fallback, unsafe: true }
  }
}
