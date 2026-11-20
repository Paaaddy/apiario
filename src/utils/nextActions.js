import { routeFromInspection } from './diagnosisRoute'
import { strings as s } from '../i18n/strings'
import { latestByColony, inspectionAgeDays } from './inspectionHistory'

const KIND_RANK = {
  'diagnosis-warning': 0,
  'overdue-inspection': 1,
  setup: 2,
  'seasonal-task': 3,
  'all-clear': 4,
}

const URGENCY_RANK = {
  urgent: 0,
  important: 1,
  routine: 2,
}

const OVERDUE_DAYS = {
  spring: 10,
  summer: 10,
  autumn: 14,
  winter: 30,
}

const DIAGNOSIS_COPY = {
  queenless: {
    suffix: 'queenless',
    urgency: 'urgent',
    reason: s.next_diagnosis_queenless_reason,
  },
  'varroa-suspect': {
    suffix: 'varroa',
    urgency: 'urgent',
    reason: s.next_diagnosis_varroa_reason,
  },
  'sick-brood': {
    suffix: 'brood',
    urgency: 'urgent',
    reason: s.next_diagnosis_brood_reason,
  },
}

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )
}

function withValues(text, values) {
  return {
    de: interpolate(text.de, values),
    en: interpolate(text.en, values),
  }
}

function buildSetupActions(colonies) {
  if (colonies.length === 0) {
    return [{
      id: 'setup-add-colony',
      kind: 'setup',
      title: s.next_setup_add_colony_title,
      reason: s.next_setup_add_colony_reason,
      urgency: 'important',
      target: { tab: 'myhive' },
    }]
  }
  return []
}

function buildFirstInspectionAction(colonies, latestByColony, inspections) {
  const undated = colonies.filter((colony) => !latestByColony.has(colony.id))
  if (undated.length === 0) return []
  if (colonies.length === 1 && !inspections.some((inspection) => inspection.colonyId === colonies[0].id)) return [{
    id: 'setup-first-inspection',
    kind: 'setup',
    title: s.next_first_inspection_title,
    reason: s.next_first_inspection_reason,
    urgency: 'important',
    target: { tab: 'inspect', colonyId: undated[0].id },
  }]
  return undated.map((colony) => ({
    id: `setup-dated-inspection-${colony.id}`,
    kind: 'setup',
    title: withValues(s.next_dated_inspection_title, { name: colony.name }),
    reason: s.next_dated_inspection_reason,
    urgency: 'important',
    target: { tab: 'inspect', colonyId: colony.id },
  }))
}

function buildDiagnosisWarnings(colonies, latestByColony) {
  return colonies.flatMap((colony) => {
    const latest = latestByColony.get(colony.id)
    const route = routeFromInspection(latest)
    const copy = DIAGNOSIS_COPY[route]
    if (!copy) return []
    return [{
      id: `diagnosis-${colony.id}-${copy.suffix}`,
      kind: 'diagnosis-warning',
      title: withValues(
        s.next_diagnosis_title,
        { name: colony.name }
      ),
      reason: copy.reason,
      urgency: copy.urgency,
      target: { tab: 'diagnose', colonyId: colony.id, warning: route },
    }]
  })
}

function buildOverdueInspectionAction(colonies, latestByColony, season, today) {
  const threshold = OVERDUE_DAYS[season] ?? 14
  const overdue = colonies.flatMap((colony) => {
    const latest = latestByColony.get(colony.id)
    if (!latest) return []
    const ageDays = inspectionAgeDays(latest.date, today)
    return ageDays > threshold ? [{ colony, ageDays }] : []
  })

  if (overdue.length === 0) return []

  const oldest = overdue.reduce((max, item) => Math.max(max, item.ageDays), 0)
  if (overdue.length === 1) {
    const { colony, ageDays } = overdue[0]
    return [{
      id: `overdue-inspection-${colony.id}`,
      kind: 'overdue-inspection',
      title: withValues(
        s.next_overdue_one_title,
        { name: colony.name }
      ),
      reason: withValues(
        s.next_overdue_one_reason,
        { days: ageDays }
      ),
      urgency: 'important',
      target: { tab: 'inspect', colonyId: colony.id },
    }]
  }

  return [{
    id: 'overdue-inspections',
    kind: 'overdue-inspection',
    title: withValues(
      s.next_overdue_many_title,
      { count: overdue.length }
    ),
    reason: withValues(
      s.next_overdue_many_reason,
      { days: oldest }
    ),
    urgency: 'important',
    target: { tab: 'inspect' },
  }]
}

function buildSeasonalAction(tasks = [], completedTaskIds = new Set()) {
  let task = null
  let bestRank = Infinity
  for (const candidate of tasks) {
    if (completedTaskIds.has(candidate.id)) continue
    const rank = URGENCY_RANK[candidate.urgency] ?? 3
    if (rank < bestRank) {
      task = candidate
      bestRank = rank
    }
  }
  if (!task) return []

  return [{
    id: `seasonal-${task.id}`,
    kind: 'seasonal-task',
    title: task.name,
    reason: task.why,
    urgency: task.urgency ?? 'routine',
    target: { tab: 'season', taskId: task.id },
  }]
}

function buildAllClearAction() {
  return {
    id: 'all-clear',
    kind: 'all-clear',
    title: s.next_all_clear_title,
    reason: s.next_all_clear_reason,
    urgency: 'routine',
    target: { tab: 'season' },
  }
}

export function buildNextActions({
  profile,
  inspections = [],
  season,
  tasks = [],
  completedTaskIds = new Set(),
  today = new Date(),
}) {
  const colonies = profile?.colonies ?? []
  const latestInspections = latestByColony(inspections)
  const actions = [
    ...buildDiagnosisWarnings(colonies, latestInspections),
    ...buildOverdueInspectionAction(colonies, latestInspections, season, today),
    ...buildSetupActions(colonies),
    ...buildFirstInspectionAction(colonies, latestInspections, inspections),
    ...buildSeasonalAction(tasks, completedTaskIds),
  ].sort((a, b) => {
    const kind = KIND_RANK[a.kind] - KIND_RANK[b.kind]
    if (kind !== 0) return kind
    return (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3)
  })

  return actions.length > 0 ? actions.slice(0, 3) : [buildAllClearAction()]
}
