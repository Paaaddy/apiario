import { useMemo } from 'react'
import { getCurrentSeason, getSeasonWeek } from '../utils/season'
import seasonsData from '../data/seasons.json'

export function useSeason(profile) {
  return useMemo(() => {
    const now = new Date()
    const season = getCurrentSeason(now)
    const week = getSeasonWeek(now)
    const seasonData = seasonsData[season]
    const experience = profile?.experience ?? 0

    const tasks = (seasonData?.tasks ?? []).filter(
      (task) => task.minExperience <= experience
    )

    return { season, label: seasonData?.label ?? '', icon: seasonData?.icon ?? '', week, tasks }
  }, [profile?.experience])
}
