import { MAX_INSPECTIONS_PER_COLONY } from './retentionLimits'
import { nextColonyId, capLog, LOG_SCHEMA_VERSION } from './persistedSlices'

/**
 * Colony data: the pure transition rules for Colonies, Inspections and the
 * task log. Every function takes the current records and returns the next
 * ones; identity (ids), time and side effects such as haptics are supplied by
 * the caller, so the rules run without React, storage or clocks.
 */

// ── Colonies (profile.colonies) ──────────────────────────────────────────────

export function addColony(profile, { name, notes = '', today }) {
  const existing = profile.colonies ?? []
  const colony = {
    id: nextColonyId(existing),
    name: (name ?? '').trim() || `Hive ${existing.length + 1}`,
    createdAt: today,
    notes,
    queenIntroducedAt: null,
    harvestLog: [],
  }
  return { ...profile, colonies: [...existing, colony] }
}

export function updateColony(profile, id, updates) {
  const colonies = (profile.colonies ?? []).map((colony) =>
    colony.id === id ? { ...colony, ...updates } : colony
  )
  return { ...profile, colonies }
}

export function removeColony(profile, id) {
  return { ...profile, colonies: (profile.colonies ?? []).filter((colony) => colony.id !== id) }
}

// ── Inspections ──────────────────────────────────────────────────────────────

export const INSPECTION_COLONY_FULL = Object.freeze({ ok: false, messageKey: 'insp_colony_full' })

/** Newest first within the Colony; the Colony keeps at most its newest N. */
export function addInspection(inspections, entry) {
  const sameColony = inspections.filter((record) => record.colonyId === entry.colonyId)
  const others = inspections.filter((record) => record.colonyId !== entry.colonyId)
  return [[entry, ...sameColony].slice(0, MAX_INSPECTIONS_PER_COLONY), others].flat()
}

/**
 * Patch one Inspection. Moving it to a Colony that already holds the maximum
 * is refused, never silently trimmed. `id` and `createdAt` cannot change.
 * @returns {{ok: true, inspections: object[]} | {ok: false, messageKey: string}}
 */
export function updateInspection(inspections, id, patch) {
  const entry = inspections.find((record) => record.id === id)
  const moving = entry && patch.colonyId && patch.colonyId !== entry.colonyId
  if (moving && inspections.filter((record) => record.colonyId === patch.colonyId).length >= MAX_INSPECTIONS_PER_COLONY) {
    return INSPECTION_COLONY_FULL
  }
  return {
    ok: true,
    inspections: inspections.map((record) =>
      record.id === id ? { ...record, ...patch, id: record.id, createdAt: record.createdAt, schemaVersion: record.schemaVersion } : record
    ),
  }
}

export function removeInspection(inspections, id) {
  return inspections.filter((record) => record.id !== id)
}

export function removeColonyInspections(inspections, colonyId) {
  return inspections.filter((record) => record.colonyId !== colonyId)
}

// ── Task log ─────────────────────────────────────────────────────────────────

export function isTaskCompleted(log, taskId) {
  return log.some((entry) => entry.type === 'task' && entry.taskId === taskId)
}

/**
 * Complete a task, or undo it when already complete.
 * `entryId` and `completedAt` are only used when completing.
 * @returns {{log: object[], completed: boolean}} `completed` is the new state.
 */
export function toggleTask(log, task, { entryId, completedAt }) {
  if (isTaskCompleted(log, task.id)) {
    return { log: log.filter((entry) => !(entry.type === 'task' && entry.taskId === task.id)), completed: false }
  }
  const entry = { id: entryId, schemaVersion: LOG_SCHEMA_VERSION, type: 'task', taskId: task.id, taskName: task.name, completedAt }
  return { log: capLog([entry, ...log]), completed: true }
}

export function addCustomEntry(log, { entryId, text, date }) {
  return capLog([{ id: entryId, schemaVersion: LOG_SCHEMA_VERSION, type: 'custom', text, date }, ...log])
}

export function deleteLogEntry(log, id) {
  return log.filter((entry) => entry.id !== id)
}

/** Newest first, by completion date for tasks and entry date for custom notes. */
export function sortLogNewestFirst(log) {
  return [...log].sort((a, b) => (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || ''))
}

export function completedTaskIds(log) {
  return new Set(log.filter((entry) => entry.type === 'task').map((entry) => entry.taskId))
}
