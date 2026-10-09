import { useCallback } from 'react'
import { useStoredState } from './useStoredState'
import { PROFILE_SCHEMA_VERSION, migrateProfile, nextColonyId } from '../utils/profileMigration'
import { isProfile, loadStoredValue } from '../utils/recordValidation'
export { buildSeededColonies } from '../utils/profileMigration'

const STORAGE_KEY = 'apiario-profile'
const SCHEMA_VERSION = PROFILE_SCHEMA_VERSION

const DEFAULT_PROFILE = {
  schemaVersion: SCHEMA_VERSION,
  hiveCount: null,
  climateZone: null,
  experience: null,
  onboardingDone: false,
  colonies: [],
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function loadProfile() {
  return loadStoredValue(STORAGE_KEY, DEFAULT_PROFILE, isProfile, (parsed) => {
    // IMPORTANT: detect the schema version from the PARSED data, not from the
    // merged-with-defaults version — otherwise the defaults' schemaVersion
    // would hide the fact that stored data is an older version.
    const storedVersion = parsed.schemaVersion ?? 0
    const migrated = storedVersion === SCHEMA_VERSION ? parsed : migrateProfile(parsed)
    // Fill in any keys that newer schema versions introduced but the stored
    // object never had.
    return { ...DEFAULT_PROFILE, ...migrated }
  })
}

export function useProfile() {
  const { state: profile, updateState: setProfile, persistenceError, retrySave } =
    useStoredState(STORAGE_KEY, loadProfile)

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      return next
    })
  }, [setProfile])

  const addColony = useCallback((name, notes = '') => {
    setProfile((prev) => {
      const existing = prev.colonies ?? []
      const colony = {
        id: nextColonyId(existing),
        name: (name ?? '').trim() || `Hive ${existing.length + 1}`,
        createdAt: today(),
        notes,
        queenIntroducedAt: null,
        harvestLog: [],
      }
      const next = { ...prev, colonies: [...existing, colony] }
      return next
    })
  }, [setProfile])

  const updateColony = useCallback((id, updates) => {
    setProfile((prev) => {
      const colonies = (prev.colonies ?? []).map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
      const next = { ...prev, colonies }
      return next
    })
  }, [setProfile])

  const removeColony = useCallback((id) => {
    setProfile((prev) => {
      const colonies = (prev.colonies ?? []).filter((c) => c.id !== id)
      const next = { ...prev, colonies }
      return next
    })
  }, [setProfile])

  return { profile, updateProfile, addColony, updateColony, removeColony, persistenceError, retrySave }
}
