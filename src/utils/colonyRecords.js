const METRIC_CONFIGS = [
  { key: 'varroa', min: 0, max: 10, lowerBetter: true },
  { key: 'broodPattern', min: 1, max: 5, lowerBetter: false },
  { key: 'population', min: 1, max: 5, lowerBetter: false },
  { key: 'honeyStores', min: 1, max: 5, lowerBetter: false },
]

function timeValue(date) {
  const time = new Date(date).getTime()
  return Number.isNaN(time) ? null : time
}

function newestFirst(a, b) {
  const aTime = timeValue(a.date)
  const bTime = timeValue(b.date)
  if (aTime == null && bTime == null) return 0
  if (aTime == null) return 1
  if (bTime == null) return -1
  return bTime - aTime
}

function oldestFirst(a, b) {
  return newestFirst(b, a)
}

function numericValue(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function daysBetween(start, end) {
  const startTime = timeValue(start)
  const endTime = timeValue(end)
  if (startTime == null || endTime == null) return null
  return Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24))
}

function lastInspectedStatus(latestInspection, today) {
  if (!latestInspection) return { kind: 'never' }
  const days = daysBetween(latestInspection.date, today)
  if (days == null) return { kind: 'unknown' }
  if (days <= 0) return { kind: 'today' }
  if (days === 1) return { kind: 'yesterday' }
  return { kind: 'daysAgo', days }
}

export function buildMetricSeries(inspections) {
  const ordered = [...inspections].sort(oldestFirst)
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
  const history = inspections
    .filter((inspection) => inspection?.colonyId === colony.id)
    .sort(newestFirst)
  const latestInspection = history[0] ?? null
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
