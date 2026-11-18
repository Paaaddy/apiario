import { inspectionFromDraft, draftFromInspection, saveVerdict } from './inspectionDraft'
import { isInspection } from './persistedSlices'

const baseDraft = {
  colonyId: 'c1',
  date: '2026-04-15',
  queenStatus: 'seen',
  queenYear: '',
  broodPattern: null,
  honeyStores: null,
  population: null,
  temperament: null,
  varroaChecked: false,
  varroa: '',
  treatment: '',
  treatmentOther: '',
  harvest: '',
  notes: '',
}

const draft = (changes = {}) => ({ ...baseDraft, ...changes })

describe('inspectionFromDraft', () => {
  it('records the observed values and drops the blank ones', () => {
    const result = inspectionFromDraft(draft({
      queenYear: ' 2025 ', broodPattern: 4, varroaChecked: true, varroa: '2.5',
      treatment: 'varroa', harvest: '3', notes: '  strong  ',
    }))

    expect(result).toEqual({
      ok: true,
      inspection: {
        colonyId: 'c1', date: '2026-04-15', queenStatus: 'seen', queenYear: '2025',
        broodPattern: 4, honeyStores: null, population: null, temperament: null,
        varroa: 2.5, treatment: 'varroa', harvest: 3, notes: 'strong',
      },
    })
    expect(isInspection(result.inspection)).toBe(true)
  })

  it.each([
    ['a blank draft', {}],
    ['a custom treatment', { treatment: 'other', treatmentOther: 'thymol' }],
    ['the scale limits', { broodPattern: 0, honeyStores: 5, population: 5, temperament: 'defensive' }],
    ['a zero varroa count and harvest', { varroaChecked: true, varroa: '0', harvest: '0' }],
  ])('produces an Inspection the stored-record validator accepts for %s', (_label, changes) => {
    const result = inspectionFromDraft(draft(changes))

    expect(result.ok).toBe(true)
    expect(isInspection(result.inspection)).toBe(true)
  })

  it('stores the free text of the "other" treatment, or "other" when left blank', () => {
    expect(inspectionFromDraft(draft({ treatment: 'other', treatmentOther: ' thymol ' })).inspection.treatment).toBe('thymol')
    expect(inspectionFromDraft(draft({ treatment: 'other' })).inspection.treatment).toBe('other')
  })

  it.each(['abc', '2.555', '-1', '1,5'])('rejects varroa text %j instead of silently dropping it', (varroa) => {
    expect(inspectionFromDraft(draft({ varroaChecked: true, varroa })))
      .toEqual({ ok: false, messageKey: 'record_invalid' })
  })

  it('ignores varroa text while "not tested" is selected', () => {
    expect(inspectionFromDraft(draft({ varroaChecked: false, varroa: 'abc' })).inspection.varroa).toBeNull()
  })

  it.each(['abc', '-1', 'Infinity'])('rejects harvest text %j', (harvest) => {
    expect(inspectionFromDraft(draft({ harvest }))).toEqual({ ok: false, messageKey: 'record_invalid' })
  })

  it('rejects values the stored-record validator would refuse', () => {
    expect(inspectionFromDraft(draft({ queenStatus: 'royal' })).ok).toBe(false)
    expect(inspectionFromDraft(draft({ broodPattern: 6 })).ok).toBe(false)
    expect(inspectionFromDraft(draft({ temperament: 'furious' })).ok).toBe(false)
  })
})

describe('draftFromInspection', () => {
  const colonies = [{ id: 'c1', name: 'Hive One' }, { id: 'c2', name: 'Hive Two' }]

  it('starts a new draft on today, the requested colony and nothing observed', () => {
    expect(draftFromInspection(null, { colonies, initialColonyId: 'c2', today: '2026-04-15' })).toEqual({
      ...baseDraft, colonyId: 'c2', queenStatus: null,
    })
  })

  it('defaults to the first colony', () => {
    expect(draftFromInspection(null, { colonies, today: '2026-04-15' }).colonyId).toBe('c1')
  })

  it('restores a recorded Inspection into editable text', () => {
    const recorded = {
      colonyId: 'c1', date: '2026-03-01', queenStatus: 'eggs', queenYear: '2025', broodPattern: 3,
      honeyStores: 2, population: 4, temperament: 'calm', varroa: 0, treatment: 'feeding', harvest: 1.5, notes: 'ok',
    }
    expect(draftFromInspection(recorded, { colonies, today: '2026-04-15' })).toEqual({
      colonyId: 'c1', date: '2026-03-01', queenStatus: 'eggs', queenYear: '2025', broodPattern: 3,
      honeyStores: 2, population: 4, temperament: 'calm', varroaChecked: true, varroa: '0',
      treatment: 'feeding', treatmentOther: '', harvest: '1.5', notes: 'ok',
    })
  })

  it.each([
    ['thymol', 'thymol'],
    ['other', ''],
  ])('keeps the "other" treatment %j editable as free text', (stored, shownText) => {
    const recorded = { colonyId: 'c1', date: '2026-03-01', queenStatus: 'seen', treatment: stored }
    const restored = draftFromInspection(recorded, { colonies, today: '2026-04-15' })

    expect(restored.treatment).toBe('other')
    expect(restored.treatmentOther).toBe(shownText)
    expect(inspectionFromDraft(restored).inspection.treatment).toBe(stored)
  })

  it('treats a missing varroa reading as not tested', () => {
    const restored = draftFromInspection({ colonyId: 'c1', date: '2026-03-01', queenStatus: 'seen' }, { colonies, today: '2026-04-15' })
    expect(restored.varroaChecked).toBe(false)
    expect(restored.varroa).toBe('')
  })
})

describe('saveVerdict', () => {
  it('closes the form after a saved or unreported outcome', () => {
    expect(saveVerdict({ ok: true })).toEqual({ close: true })
    expect(saveVerdict(undefined)).toEqual({ close: true })
  })

  it('closes the form when the durable write failed, because persistence keeps the draft', () => {
    expect(saveVerdict({ ok: false, error: 'storage', messageKey: 'storage_error' })).toEqual({ close: true })
  })

  it('keeps the form open and names the problem when the change was rejected', () => {
    expect(saveVerdict({ ok: false, error: 'validation', messageKey: 'record_invalid' }))
      .toEqual({ close: false, messageKey: 'record_invalid' })
    expect(saveVerdict({ ok: false, messageKey: 'insp_colony_full' }))
      .toEqual({ close: false, messageKey: 'insp_colony_full' })
  })
})
