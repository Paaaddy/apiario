import { useMemo } from 'react'
import { getCurrentSeason, getIsoWeek, getIsoWeekRange } from '../utils/season'
import seasonsData from '../data/seasons.json'

/**
 * Derives the season view for the given profile and target date.
 *
 * `forDate` defaults to "right now". Pass an explicit Date to look
 * at a different week — used by the week picker on SeasonScreen.
 * Tasks are filtered by `minExperience` and by secret-task unlock
 * status (`unlockAt` vs `completedCount`). In addition to `tasks`,
 * this hook returns:
 *
 *   - `season`           — the season that `forDate` falls into
 *   - `label`, `icon`    — bilingual label / emoji for the season
 *   - `week`             — ISO 8601 calendar week number (1–53)
 *   - `weekRange`        — { start, end } Monday → Sunday for that week
 *   - `nextLockedSecret` — next locked secret for "N tasks to unlock" teaser
 */
export function useSeason(profile, completedCount = 0, forDate = null) {
  const targetTime = forDate ? forDate.getTime() : null
  return useMemo(() => {
    const now = targetTime != null ? new Date(targetTime) : new Date()
    const season = getCurrentSeason(now)
    const week = getIsoWeek(now)
    const weekRange = getIsoWeekRange(now)
    const seasonData = seasonsData[season]

    if (!profile) {
      return { season, label: seasonData?.label ?? '', icon: seasonData?.icon ?? '', week, weekRange, tasks: [], nextLockedSecret: null, completedCount }
    }

    const experience = profile.experience ?? 0

    const allTasks = seasonData?.tasks ?? []

    const tasks = allTasks.filter((task) => {
      if (task.minExperience > experience) return false
      if (task.secret && (task.unlockAt ?? 0) > completedCount) return false
      return true
    })

    const nextLockedSecret = allTasks
      .filter(
        (task) =>
          task.secret &&
          task.minExperience <= experience &&
          (task.unlockAt ?? 0) > completedCount
      )
      .sort((a, b) => (a.unlockAt ?? 0) - (b.unlockAt ?? 0))[0] ?? null

    return {
      season,
      label: seasonData?.label ?? '',
      icon: seasonData?.icon ?? '',
      week,
      weekRange,
      tasks,
      nextLockedSecret,
      completedCount,
    }
  }, [profile, completedCount, targetTime])
}
