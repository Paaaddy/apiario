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

/**
 * Returns `[isoYear, isoWeek]` for the given date following ISO 8601:
 *   - weeks run Monday → Sunday
 *   - week 1 is the week that contains the first Thursday of the year
 *   - a week is always entirely in one ISO year, which may differ from
 *     the calendar year at the very start / end of the year
 *
 * Implementation is the standard "Thursday of the current week" trick.
 */
export function getIsoWeekAndYear(date = new Date()) {
  // Work in UTC to avoid DST edge cases.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Make Monday = 0, Sunday = 6.
  const dayOfWeek = (d.getUTCDay() + 6) % 7
  // Shift to the Thursday of this ISO week — that Thursday determines the year.
  d.setUTCDate(d.getUTCDate() - dayOfWeek + 3)
  const isoYear = d.getUTCFullYear()
  // First Thursday of the ISO year.
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstThursdayDow = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDow + 3)
  const week =
    1 +
    Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return [isoYear, week]
}

/**
 * Convenience wrapper: just the week number.
 */
export function getIsoWeek(date = new Date()) {
  return getIsoWeekAndYear(date)[1]
}

/**
 * Monday (inclusive) → Sunday (inclusive) for the ISO week containing
 * the given date. Returned as two Date objects at midnight local time.
 */
export function getIsoWeekRange(date = new Date()) {
  const d = new Date(date)
  // Monday = 1 … Sunday = 0 in JS; we want the most recent Monday ≤ d.
  const jsDay = d.getDay()
  const offsetToMonday = (jsDay + 6) % 7 // 0..6
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offsetToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

/**
 * Returns a new Date offset by the given number of whole weeks from
 * the provided date, preserving the time-of-day. Used by the week
 * picker to step forward / backward.
 */
export function addWeeks(date, weeks) {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

/**
 * True when the two dates fall in the same ISO week.
 */
export function isSameIsoWeek(a, b) {
  const [ay, aw] = getIsoWeekAndYear(a)
  const [by, bw] = getIsoWeekAndYear(b)
  return ay === by && aw === bw
}
