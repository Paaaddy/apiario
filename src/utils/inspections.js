export function parseInspectionDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export function localDateString(today = new Date()) {
  return `${String(today.getFullYear()).padStart(4, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function calendarDay(date) {
  const utc = new Date(0)
  utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  utc.setUTCHours(0, 0, 0, 0)
  return utc.getTime() / 86400000
}

export function inspectionAgeDays(date, today = new Date()) {
  const start = parseInspectionDate(date)
  const end = today instanceof Date ? today : parseInspectionDate(today)
  if (!start || !end || !Number.isFinite(end.getTime())) return null
  return Math.max(0, calendarDay(end) - calendarDay(start))
}

function creationTime(inspection) {
  if (typeof inspection.createdAt !== 'string' || !inspection.createdAt.trim()) return null
  const time = Date.parse(inspection.createdAt)
  return Number.isFinite(time) ? time : null
}

export function orderInspections(inspections, { oldestFirst = false } = {}) {
  const direction = oldestFirst ? -1 : 1
  const ordered = [...inspections].sort((a, b) => {
    const aDate = parseInspectionDate(a.date)
    const bDate = parseInspectionDate(b.date)
    if (!aDate && !bDate) return 0
    if (!aDate) return 1
    if (!bDate) return -1
    return (bDate - aDate) * direction
  })
  // Missing timestamps are barriers: a pairwise fallback comparator would be
  // non-transitive and could move records across an ambiguous observation.
  let start = 0
  while (start < ordered.length) {
    if (!parseInspectionDate(ordered[start].date) || creationTime(ordered[start]) == null) {
      start += 1
      continue
    }
    let end = start + 1
    while (end < ordered.length && ordered[end].date === ordered[start].date && creationTime(ordered[end]) != null) end += 1
    const run = ordered.slice(start, end).sort((a, b) => (creationTime(b) - creationTime(a)) * direction)
    ordered.splice(start, run.length, ...run)
    start = end
  }
  return ordered
}

export function groupByColony(inspections) {
  const map = new Map()
  for (const e of inspections) {
    const arr = map.get(e.colonyId)
    if (arr) arr.push(e)
    else map.set(e.colonyId, [e])
  }
  for (const [colonyId, arr] of map) {
    map.set(colonyId, orderInspections(arr))
  }
  return map
}

export function latestByColony(inspections) {
  const grouped = groupByColony(inspections)
  const map = new Map()
  for (const [colonyId, arr] of grouped) {
    const latest = arr.find((inspection) => parseInspectionDate(inspection.date))
    if (latest) map.set(colonyId, latest)
  }
  return map
}

export function latestOverall(inspections) {
  const candidates = new Set(latestByColony(inspections).values())
  return orderInspections(inspections.filter((inspection) => candidates.has(inspection)))[0] ?? null
}
