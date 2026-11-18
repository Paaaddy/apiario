import {
  QUEEN_STATUSES, TEMPERAMENTS, isScaleValue, isNonnegativeFiniteNumber,
} from './persistedSlices'

const INVALID = { ok: false, messageKey: 'record_invalid' }
const VARROA_TEXT = /^\d+(\.\d{1,2})?$/

const isOneOf = (allowed) => (value) => value == null || allowed.includes(value)
const isOptionalScale = (value) => value == null || isScaleValue(value)

function parseVarroa(draft) {
  if (!draft.varroaChecked) return { ok: true, value: null }
  const text = draft.varroa.trim()
  if (text === '') return { ok: true, value: null }
  return VARROA_TEXT.test(text) ? { ok: true, value: Number(text) } : { ok: false }
}

function parseHarvest(text) {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: true, value: null }
  const value = Number(trimmed)
  return isNonnegativeFiniteNumber(value) ? { ok: true, value } : { ok: false }
}

function treatmentOf(draft) {
  if (draft.treatment === 'other') return draft.treatmentOther.trim() || 'other'
  return draft.treatment || null
}

/**
 * Turns the values of an Inspection draft into a recordable Inspection, or
 * rejects the draft. A value that cannot be recorded is never dropped.
 */
export function inspectionFromDraft(draft) {
  const varroa = parseVarroa(draft)
  const harvest = parseHarvest(draft.harvest)
  const scaleValues = [draft.broodPattern, draft.honeyStores, draft.population]
  if (!varroa.ok || !harvest.ok ||
    !isOneOf(QUEEN_STATUSES)(draft.queenStatus) ||
    !isOneOf(TEMPERAMENTS)(draft.temperament) ||
    !scaleValues.every(isOptionalScale)) return INVALID

  return {
    ok: true,
    inspection: {
      colonyId: draft.colonyId,
      date: draft.date,
      queenStatus: draft.queenStatus,
      queenYear: draft.queenYear.trim() || null,
      broodPattern: draft.broodPattern,
      honeyStores: draft.honeyStores,
      population: draft.population,
      temperament: draft.temperament,
      varroa: varroa.value,
      treatment: treatmentOf(draft),
      harvest: harvest.value,
      notes: draft.notes.trim() || null,
    },
  }
}

export const TREATMENT_PRESETS = ['none', 'varroa', 'feeding', 'queen']

function treatmentDraft(treatment) {
  if (treatment == null) return { treatment: '', treatmentOther: '' }
  if (TREATMENT_PRESETS.includes(treatment)) return { treatment, treatmentOther: '' }
  return { treatment: 'other', treatmentOther: treatment === 'other' ? '' : treatment }
}

/**
 * The values to show for a new Inspection draft, or for editing a recorded
 * one. A custom treatment comes back as "other" plus its free text.
 */
export function draftFromInspection(initial, { colonies = [], initialColonyId = null, today }) {
  const recorded = initial ?? {}
  return {
    colonyId: recorded.colonyId ?? initialColonyId ?? (colonies[0]?.id ?? ''),
    date: recorded.date ?? today,
    queenStatus: recorded.queenStatus ?? null,
    queenYear: recorded.queenYear ?? '',
    broodPattern: recorded.broodPattern ?? null,
    honeyStores: recorded.honeyStores ?? null,
    population: recorded.population ?? null,
    temperament: recorded.temperament ?? null,
    varroaChecked: recorded.varroa != null,
    varroa: recorded.varroa != null ? String(recorded.varroa) : '',
    ...treatmentDraft(recorded.treatment),
    harvest: recorded.harvest != null ? String(recorded.harvest) : '',
    notes: recorded.notes ?? '',
  }
}

/**
 * Whether the form closes after `onSave` returned `outcome`. A rejected change
 * keeps the form open because no mutation was applied. A failed durable write
 * closes it: persistence keeps the change as an unsaved draft.
 */
export function saveVerdict(outcome) {
  const rejected = outcome?.ok === false &&
    (outcome.error === 'validation' || outcome.messageKey === 'insp_colony_full')
  return rejected ? { close: false, messageKey: outcome.messageKey } : { close: true }
}
