const MONTH_TO_SEASON = {
  3: 'spring', 4: 'spring', 5: 'spring',
  6: 'summer', 7: 'summer', 8: 'summer',
  9: 'autumn', 10: 'autumn', 11: 'autumn',
  12: 'winter', 1: 'winter', 2: 'winter',
}

const SEASON_START_MONTH = {
  spring: 3,
  summer: 6,
  autumn: 9,
  winter: 12,
}

export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1
  return MONTH_TO_SEASON[month]
}

export function getSeasonWeek(date = new Date()) {
  const season = getCurrentSeason(date)
  const startMonth = SEASON_START_MONTH[season]
  const year = date.getFullYear()
  let startDate
  if (season === 'winter' && date.getMonth() + 1 <= 2) {
    // January or February — winter started previous December
    startDate = new Date(year - 1, 11, 1)
  } else {
    startDate = new Date(year, startMonth - 1, 1)
  }
  const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24))
  return Math.floor(daysDiff / 7) + 1
}
