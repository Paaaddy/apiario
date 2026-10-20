/**
 * The colony record module: one colony together with its derived inspection
 * history and metrics.
 *
 * It owns the whole derivation — parsing and ordering inspection dates
 * (including the ambiguous same-day and missing-date cases), grouping and
 * selecting the latest observation, the metric series with their bounds and
 * labels, and the last-inspected status and its text. Consumers read those
 * answers off a record; none of them reimplements any part of it.
 */

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
  return colonyChronology(inspections).latest
}

/**
 * One pass over the inspections that answers both chronology questions every
 * consumer asks: the ordered history per colony and that colony's latest
 * dated observation. Building them together keeps the two answers derived
 * from a single ordering, so no consumer can end up with a latest that its
 * own history disagrees with.
 */
export function colonyChronology(inspections) {
  const byColony = groupByColony(inspections)
  const latest = new Map()
  for (const [colonyId, history] of byColony) {
    const latestInspection = history.find((inspection) => parseInspectionDate(inspection.date))
    if (latestInspection) latest.set(colonyId, latestInspection)
  }
  return { byColony, latest }
}

export function latestOverall(inspections) {
  const candidates = new Set(latestByColony(inspections).values())
  return orderInspections(inspections.filter((inspection) => candidates.has(inspection)))[0] ?? null
}


// The colony record owns its metric vocabulary: which series exist, the bounds
// each one is drawn against, and the strings.js key it is labelled with. A
// consumer that needs a sparkline reads all three off the record instead of
// restating them, so the series cannot drift apart between screens.
//
// These are keys, not the { de, en } pairs themselves, because this module is
// imported directly by Node in the timezone regression
// (src/utils/inspections.test.js) where there is no bundler to resolve an
// import of the string table.
const METRIC_CONFIGS = [
  { key: 'varroa',       labelKey: 'insp_varroa_label',      min: 0, max: 10, lowerBetter: true },
  { key: 'broodPattern', labelKey: 'insp_brood_label',       min: 1, max: 5,  lowerBetter: false },
  { key: 'population',   labelKey: 'insp_population_label',  min: 1, max: 5,  lowerBetter: false },
  { key: 'honeyStores',  labelKey: 'insp_honeystores_label', min: 1, max: 5,  lowerBetter: false },
]

function numericValue(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function lastInspectedStatus(latestInspection, today) {
  if (!latestInspection) return { kind: 'never' }
  const days = inspectionAgeDays(latestInspection.date, today)
  if (days == null) return { kind: 'unknown' }
  if (days <= 0) return { kind: 'today' }
  if (days === 1) return { kind: 'yesterday' }
  return { kind: 'daysAgo', days }
}

/**
 * The metric series of a colony record, in display order, each carrying its
 * bounds, its label key and its oldest-first points.
 */
export function colonyMetricSeries(record) {
  return METRIC_CONFIGS.map((config) => ({
    ...config,
    points: record?.metrics?.[config.key]?.points ?? [],
  }))
}

const LAST_INSPECTED_LABEL_KEYS = {
  never: 'insp_never',
  today: 'insp_today',
  yesterday: 'insp_yesterday',
  unknown: 'insp_unknown',
}

/**
 * The last-inspected status is only a code; this is the single place that
 * turns it into text. An unparseable date is its own status and gets its own
 * label instead of being silently reported as "never inspected".
 *
 * The string table is injected for the same reason the metric series carry
 * keys rather than pairs: this module stays free of app imports.
 */
export function lastInspectedLabel(status, t, strings) {
  if (!status) return t(strings.insp_never)
  if (status.kind === 'daysAgo') return t(strings.insp_days_ago).replace('{n}', status.days)
  return t(strings[LAST_INSPECTED_LABEL_KEYS[status.kind]] ?? strings.insp_never)
}

export function buildMetricSeries(inspections) {
  const ordered = orderInspections(inspections, { oldestFirst: true })
    .filter((inspection) => parseInspectionDate(inspection.date))
  return Object.fromEntries(
    METRIC_CONFIGS.map((config) => [
      config.key,
      {
        ...config,
        points: ordered
          .map((inspection) => ({
            date: inspection.date,
            value: numericValue(inspection[config.key]),
          }))
          .filter((point) => point.value != null),
      },
    ])
  )
}

export function buildColonyRecord(colony, inspections = [], options = {}) {
  if (!colony) return null
  const today = options.today ?? new Date()
  const history = groupByColony(inspections.filter((inspection) => inspection?.colonyId === colony.id)).get(colony.id) ?? []
  // `history` is already ordered, so its first dated observation is the latest
  // one: no second pass, and the record's latest can never disagree with the
  // history it is shown next to.
  const latestInspection = history.find((inspection) => parseInspectionDate(inspection.date)) ?? null
  const totalHarvestKg = history.reduce((sum, inspection) => {
    const harvest = numericValue(inspection.harvest)
    return harvest == null ? sum : sum + harvest
  }, 0)

  return {
    colony,
    history,
    inspectionCount: history.length,
    latestInspection,
    lastInspected: lastInspectedStatus(latestInspection, today),
    totalHarvestKg,
    metrics: buildMetricSeries(history),
  }
}

export function buildColonyRecords(colonies = [], inspections = [], options = {}) {
  return colonies
    .map((colony) => buildColonyRecord(colony, inspections, options))
    .filter(Boolean)
}

export function findColonyRecord(records, colonyId) {
  return records.find((record) => record.colony.id === colonyId) ?? null
}
