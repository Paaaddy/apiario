import { isProfile, isInspection, isLogEntry, uniqueRecords } from './recordValidation'
import { MAX_INSPECTIONS_PER_COLONY, MAX_TASK_LOG_ENTRIES } from './retentionLimits'
import { migrateProfile } from './profileMigration'

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
