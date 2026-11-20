import { useCallback } from 'react'
import { useSliceState } from './useSliceState'
import { SLICES } from '../utils/persistedSlices'
import * as colonyData from '../utils/colonyData'
import { completeOnboarding as completeProfileOnboarding } from '../utils/profileAnswers'
export { buildSeededColonies } from '../utils/persistedSlices'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function useProfile() {
  const { state: profile, updateState: setProfile, persistenceError, retrySave } =
    useSliceState(SLICES.profile)

  const updateProfile = useCallback((updates) => {
    return setProfile((prev) => ({ ...prev, ...updates }))
  }, [setProfile])

  const completeOnboarding = useCallback((answers) => {
    return setProfile((prev) => completeProfileOnboarding(prev, answers))
  }, [setProfile])

  const addColony = useCallback((name, notes = '') => {
    return setProfile((prev) => colonyData.addColony(prev, { name, notes, today: today() }))
  }, [setProfile])

  const updateColony = useCallback((id, updates) => {
    return setProfile((prev) => colonyData.updateColony(prev, id, updates))
  }, [setProfile])

  const removeColony = useCallback((id) => {
    return setProfile((prev) => colonyData.removeColony(prev, id))
  }, [setProfile])

  return { profile, updateProfile, completeOnboarding, addColony, updateColony, removeColony, persistenceError, retrySave }
}
