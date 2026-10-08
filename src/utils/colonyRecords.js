import { groupByColony, latestOverall, orderInspections, parseInspectionDate, inspectionAgeDays } from './inspections'

const METRIC_CONFIGS = [
  { key: 'varroa', min: 0, max: 10, lowerBetter: true },
  { key: 'broodPattern', min: 1, max: 5, lowerBetter: false },
  { key: 'population', min: 1, max: 5, lowerBetter: false },
  { key: 'honeyStores', min: 1, max: 5, lowerBetter: false },
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
  const latestInspection = latestOverall(history)
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
