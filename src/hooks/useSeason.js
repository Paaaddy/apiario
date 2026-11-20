import { useMemo } from 'react'
import { seasonView } from '../utils/seasonGuidance'

/**
 * The season view for the given profile and target date. `forDate`
 * defaults to "right now". Kept for callers that need only the season
 * view; Next actions and the pending count come from `useSeasonGuidance`.
 */
export function useSeason(profile, completedCount = 0, forDate = null) {
  const targetTime = forDate ? forDate.getTime() : null
  return useMemo(
    () => seasonView(profile, completedCount, targetTime != null ? new Date(targetTime) : null),
    [profile, completedCount, targetTime]
  )
}
