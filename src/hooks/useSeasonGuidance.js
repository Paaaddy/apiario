import { useMemo } from 'react'
import { seasonGuidance } from '../utils/seasonGuidance'

const NO_INSPECTIONS = []
const NO_COMPLETED = new Set()

/**
 * Season guidance for the profile: the browsed week's season view, plus
 * Next actions and the pending urgent count, which always answer for today.
 */
export function useSeasonGuidance({
  profile,
  inspections = NO_INSPECTIONS,
  completedTaskIds = NO_COMPLETED,
  today,
  browsedDate = null,
}) {
  const todayTime = today ? today.getTime() : null
  const browsedTime = browsedDate ? browsedDate.getTime() : null
  return useMemo(
    () => seasonGuidance({
      profile,
      inspections,
      completedTaskIds,
      today: todayTime != null ? new Date(todayTime) : undefined,
      browsedDate: browsedTime != null ? new Date(browsedTime) : null,
    }),
    [profile, inspections, completedTaskIds, todayTime, browsedTime]
  )
}
