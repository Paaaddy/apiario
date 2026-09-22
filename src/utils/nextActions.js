import { routeFromInspection } from './diagnosisFlow'

const DAY_MS = 24 * 60 * 60 * 1000

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
    reason: {
      de: 'Die letzte Kontrolle hat die Königin nicht bestätigt. Diagnose starten.',
      en: 'The latest inspection did not confirm the queen. Run diagnosis.',
    },
  },
  'varroa-suspect': {
    suffix: 'varroa',
    urgency: 'urgent',
    reason: {
      de: 'Die letzte Kontrolle zeigt erhöhten Varroa-Druck. Diagnose starten.',
      en: 'The latest inspection shows high varroa pressure. Run diagnosis.',
    },
  },
  'sick-brood': {
    suffix: 'brood',
    urgency: 'urgent',
    reason: {
      de: 'Die letzte Kontrolle zeigt ein schwaches Brutbild. Diagnose starten.',
      en: 'The latest inspection shows a weak brood pattern. Run diagnosis.',
    },
  },
}

function daysBetween(start, end) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(0, Math.floor((b - a) / DAY_MS))
}

function parseInspectionDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getLatestInspectionsByColony(inspections = []) {
  const latest = new Map()
  inspections.forEach((inspection) => {
    const date = parseInspectionDate(inspection.date)
    if (!date) return
    const existing = latest.get(inspection.colonyId)
    if (!existing || date > existing.date) {
      latest.set(inspection.colonyId, { inspection, date })
    }
  })
  return latest
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
      title: { de: 'Erstes Volk hinzufügen', en: 'Add your first colony' },
      reason: {
        de: 'Nächste Schritte werden hilfreicher, sobald Apiario deine Völker kennt.',
        en: 'Next actions get smarter once Apiario knows what you keep.',
      },
      urgency: 'important',
      target: { tab: 'myhive' },
    }]
  }
  return []
}

function buildFirstInspectionAction(colonies, inspections) {
  if (colonies.length === 0 || inspections.length > 0) return []
  return [{
    id: 'setup-first-inspection',
    kind: 'setup',
    title: { de: 'Erste Kontrolle erfassen', en: 'Record your first inspection' },
    reason: {
      de: 'Eine Kontrolle macht die Hinweise zu deinen Völkern genauer.',
      en: 'One inspection makes colony guidance more precise.',
    },
    urgency: 'important',
    target: { tab: 'inspect' },
  }]
}

function buildDiagnosisWarnings(colonies, latestByColony) {
  return colonies.flatMap((colony) => {
    const latest = latestByColony.get(colony.id)
    const route = routeFromInspection(latest?.inspection)
    const copy = DIAGNOSIS_COPY[route]
    if (!copy) return []
    return [{
      id: `diagnosis-${colony.id}-${copy.suffix}`,
      kind: 'diagnosis-warning',
      title: withValues(
        { de: 'Mögliches Problem bei {name}', en: 'Possible issue in {name}' },
        { name: colony.name }
      ),
      reason: copy.reason,
      urgency: copy.urgency,
      target: { tab: 'diagnose' },
    }]
  })
}

function buildOverdueInspectionAction(colonies, latestByColony, season, today) {
  const threshold = OVERDUE_DAYS[season] ?? 14
  const overdue = colonies.flatMap((colony) => {
    const latest = latestByColony.get(colony.id)
    if (!latest) return []
    const ageDays = daysBetween(latest.date, today)
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
        { de: '{name} kontrollieren', en: 'Inspect {name}' },
        { name: colony.name }
      ),
      reason: withValues(
        { de: 'Letzte Kontrolle war vor {days} Tag(en).', en: 'Last inspection was {days} days ago.' },
        { days: ageDays }
      ),
      urgency: 'important',
      target: { tab: 'inspect' },
    }]
  }

  return [{
    id: 'overdue-inspections',
    kind: 'overdue-inspection',
    title: withValues(
      { de: '{count} Völker kontrollieren', en: 'Inspect {count} colonies' },
      { count: overdue.length }
    ),
    reason: withValues(
      { de: 'Älteste Kontrolle war vor {days} Tag(en).', en: 'Oldest inspection was {days} days ago.' },
      { days: oldest }
    ),
    urgency: 'important',
    target: { tab: 'inspect' },
  }]
}

function buildSeasonalAction(tasks = [], completedTaskIds = new Set()) {
  const incomplete = tasks.filter((task) => !completedTaskIds.has(task.id))
  if (incomplete.length === 0) return []
  const task = [...incomplete].sort((a, b) => {
    const urgency = (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3)
    return urgency || tasks.indexOf(a) - tasks.indexOf(b)
  })[0]

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
    title: { de: 'Keine dringenden nächsten Schritte', en: 'No urgent next actions' },
    reason: {
      de: 'Folge weiter der saisonalen Checkliste.',
      en: 'Keep following the seasonal checklist.',
    },
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
  const latestByColony = getLatestInspectionsByColony(inspections)
  const actions = [
    ...buildDiagnosisWarnings(colonies, latestByColony),
    ...buildOverdueInspectionAction(colonies, latestByColony, season, today),
    ...buildSetupActions(colonies),
    ...buildFirstInspectionAction(colonies, inspections),
    ...buildSeasonalAction(tasks, completedTaskIds),
  ].sort((a, b) => {
    const kind = KIND_RANK[a.kind] - KIND_RANK[b.kind]
    if (kind !== 0) return kind
    return (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3)
  })

  return actions.length > 0 ? actions.slice(0, 3) : [buildAllClearAction()]
}
