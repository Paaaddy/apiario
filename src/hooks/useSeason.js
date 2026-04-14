import { useMemo } from 'react'
import { getCurrentSeason, getSeasonWeek } from '../utils/season'
import seasonsData from '../data/seasons.json'

/**
 * Derives the current season view for the given profile.
 *
 * Tasks are filtered by `minExperience` as before, and — new — by
 * secret-task unlock status. A task with `secret: true` is only returned
 * once the user's lifetime task count has reached its `unlockAt`
 * threshold. In addition to `tasks`, this hook returns `nextLockedSecret`,
 * the secret task in the current season whose `unlockAt` is closest above
 * the user's count (or `null` if there is none). SeasonScreen uses it to
 * render a "hidden tip unlocks in N more tasks" teaser.
 */
export function useSeason(profile, completedCount = 0) {
  return useMemo(() => {
    const now = new Date()
    const season = getCurrentSeason(now)
    const week = getSeasonWeek(now)
    const seasonData = seasonsData[season]
    const experience = profile?.experience ?? 0

    const allTasks = seasonData?.tasks ?? []

    const tasks = allTasks.filter((task) => {
      if (task.minExperience > experience) return false
      if (task.secret && (task.unlockAt ?? 0) > completedCount) return false
      return true
    })

    // The *next* secret for this season, if any — used to tease progression.
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
      tasks,
      nextLockedSecret,
      completedCount,
    }
  }, [profile?.experience, completedCount])
}
