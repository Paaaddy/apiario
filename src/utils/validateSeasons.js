import seasonsData from '../data/seasons.json'

/**
 * Dev-only: walks the seasons data and logs any broken season or task
 * payloads — missing required fields, malformed months, bad urgency /
 * experience levels, duplicate ids, or malformed secret / risk extras.
 * Called once on mount in useSeason.
 */
export function validateSeasonsTree(data = seasonsData) {
  if (!import.meta.env.DEV) return

  const errors = []
  const URGENCIES = ['urgent', 'important', 'routine']
  const seenTaskIds = new Set()

  for (const [seasonKey, season] of Object.entries(data)) {
    if (!season.label) errors.push(`[${seasonKey}] missing 'label'`)
    if (!season.icon) errors.push(`[${seasonKey}] missing 'icon'`)
    if (!Array.isArray(season.months) || season.months.length === 0) {
      errors.push(`[${seasonKey}] missing or empty 'months'`)
    } else {
      season.months.forEach((m, i) => {
        if (!Number.isInteger(m) || m < 1 || m > 12) {
          errors.push(`[${seasonKey}].months[${i}] not an integer in 1–12: '${m}'`)
        }
      })
    }
    if (!Array.isArray(season.tasks) || season.tasks.length === 0) {
      errors.push(`[${seasonKey}] missing or empty 'tasks'`)
      continue
    }

    season.tasks.forEach((task, i) => {
      const loc = `[${seasonKey}].tasks[${i}]`
      if (!task.id) errors.push(`${loc} missing 'id'`)
      else if (seenTaskIds.has(task.id)) errors.push(`${loc} duplicate id: '${task.id}'`)
      else seenTaskIds.add(task.id)
      if (!task.name) errors.push(`${loc} missing 'name'`)
      if (!task.why) errors.push(`${loc} missing 'why'`)
      if (!task.urgency) errors.push(`${loc} missing 'urgency'`)
      else if (!URGENCIES.includes(task.urgency)) {
        errors.push(`${loc} 'urgency' not in {urgent, important, routine}: '${task.urgency}'`)
      }
      if (task.minExperience == null) errors.push(`${loc} missing 'minExperience'`)
      else if (!Number.isInteger(task.minExperience) || task.minExperience < 0 || task.minExperience > 2) {
        errors.push(`${loc} 'minExperience' outside 0–2: '${task.minExperience}'`)
      }
      if (task.secret) {
        if (!Number.isInteger(task.unlockAt) || task.unlockAt < 0) {
          errors.push(`${loc} 'secret' present but 'unlockAt' malformed: '${task.unlockAt}'`)
        }
      }
      if (task.unlockAt != null && !task.secret) {
        errors.push(`${loc} 'unlockAt' present without 'secret': '${task.unlockAt}'`)
      }
      if (task.risk != null) {
        if (!task.risk.level || !['caution', 'warning'].includes(task.risk.level)) {
          errors.push(`${loc} 'risk.level' malformed: '${task.risk?.level}'`)
        }
        if (!task.risk.note || !task.risk.mitigation) {
          errors.push(`${loc} 'risk' present but missing 'note' or 'mitigation'`)
        }
      }
    })
  }

  if (errors.length > 0) {
    console.warn('[Apiario] seasons.json validation errors:\n' + errors.join('\n'))
  } else {
    console.debug('[Apiario] seasons.json OK —', Object.keys(data).length, 'seasons')
  }
}
