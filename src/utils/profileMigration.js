export const PROFILE_SCHEMA_VERSION = 3

function nextColonyNumericId(existing) {
  let max = 0
  for (const colony of existing) {
    const match = /^col-(\d+)$/.exec(colony.id ?? '')
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return max
}

export function nextColonyId(existing) {
  return `col-${nextColonyNumericId(existing) + 1}`
}

export function buildSeededColonies(count, existing = []) {
  const colonies = existing ?? []
  const remaining = Math.max(0, Number(count) || 0) - colonies.length
  if (remaining <= 0) return colonies
  const createdAt = new Date().toISOString().split('T')[0]
  const start = nextColonyNumericId(colonies)
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
