import { useMemo } from 'react'
import { getCurrentSeason, getIsoWeek, getIsoWeekRange, addWeeks } from '../utils/season'
import seasonsData from '../data/seasons.json'
import { strings as s } from '../i18n/strings'

const WINTER_STORE_KG = {
  northern:      s.winter_store_kg_northern,
  central:       s.winter_store_kg_central,
  mediterranean: s.winter_store_kg_mediterranean,
  other:         s.winter_store_kg_other,
}

const WINTER_BEGINNER_TIPS = {
  northern:      s.winter_store_beginner_tip_northern,
  central:       s.winter_store_beginner_tip_central,
  mediterranean: s.winter_store_beginner_tip_mediterranean,
  other:         s.winter_store_beginner_tip_other,
}

function getWinterStoreGuidance(climateZone, experience) {
  const zone = climateZone || 'central'
  return {
    titleString: s.winter_store_title,
    subtitleString: s.winter_store_subtitle,
    kgString: WINTER_STORE_KG[zone],
    beginnerTipString: experience === 0 ? WINTER_BEGINNER_TIPS[zone] : null,
  }
}

/**
 * Returns a week offset (in weeks) for the season boundary based on
 * the user's climate zone:
 *
 *  - northern:      spring 2 wks earlier, autumn 2 wks later
 *  - mediterranean: spring 2 wks later,  autumn 2 wks earlier
 *  - central/other: no shift
 */
function climateWeekOffset(climateZone, season) {
  if (climateZone === 'northern') {
    return season === 'spring' ? -2 : season === 'autumn' ? 2 : 0
  }
  if (climateZone === 'mediterranean') {
    return season === 'spring' ? 2 : season === 'autumn' ? -2 : 0
  }
  return 0
}

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

    // Determine the "raw" season first so we can compute the climate offset
    const rawSeason = getCurrentSeason(now)
    const climateZone = profile?.climateZone ?? null
    const offset = climateWeekOffset(climateZone, rawSeason)
    const effective = offset !== 0 ? addWeeks(now, offset) : now

    const season = getCurrentSeason(effective)
    const week = getIsoWeek(effective)
    const weekRange = getIsoWeekRange(effective)
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

    // Climate shift label for season screen hint
    let climateShiftLabel = null
    if (climateZone === 'northern' && (rawSeason === 'spring' || rawSeason === 'autumn')) {
      climateShiftLabel = rawSeason === 'spring'
        ? 'climate_spring_advance'
        : 'climate_autumn_delay'
    } else if (climateZone === 'mediterranean' && (rawSeason === 'spring' || rawSeason === 'autumn')) {
      climateShiftLabel = rawSeason === 'spring'
        ? 'climate_spring_delay'
        : 'climate_autumn_advance'
    }

    const winterStoreGuidance = season === 'winter' ? getWinterStoreGuidance(climateZone, experience) : null

    return {
      season,
      label: seasonData?.label ?? '',
      icon: seasonData?.icon ?? '',
      week,
      weekRange,
      tasks,
      nextLockedSecret,
      completedCount,
      climateShiftLabel,
      winterStoreGuidance,
    }
  }, [profile, completedCount, targetTime])
}
