import { useCallback } from 'react'
import { useSliceState } from './useStoredState'
import { nextColonyId, SLICES } from '../utils/persistedSlices'
export { buildSeededColonies } from '../utils/persistedSlices'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function useProfile() {
  const { state: profile, updateState: setProfile, persistenceError, retrySave } =
    useSliceState(SLICES.profile)

  const updateProfile = useCallback((updates) => {
    return setProfile((prev) => {
      const next = { ...prev, ...updates }
      return next
    })
  }, [setProfile])

  const addColony = useCallback((name, notes = '') => {
    return setProfile((prev) => {
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
    return setProfile((prev) => {
      const colonies = (prev.colonies ?? []).map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
      const next = { ...prev, colonies }
      return next
    })
  }, [setProfile])

  const removeColony = useCallback((id) => {
    return setProfile((prev) => {
      const colonies = (prev.colonies ?? []).filter((c) => c.id !== id)
      const next = { ...prev, colonies }
      return next
    })
  }, [setProfile])

  return { profile, updateProfile, addColony, updateColony, removeColony, persistenceError, retrySave }
}
