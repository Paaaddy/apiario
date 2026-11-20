import { describe, expect, it } from 'vitest'
import * as colonyData from './colonyData'
import { MAX_INSPECTIONS_PER_COLONY, MAX_TASK_LOG_ENTRIES } from './retentionLimits'

const inspection = (id, colonyId, extra = {}) => ({ id, colonyId, createdAt: '2026-01-01', ...extra })

describe('colonies', () => {
  const profile = { hiveCount: 2, colonies: [{ id: 'col-3', name: 'A' }] }

  it('adds a Colony with the next id, a trimmed name and today', () => {
    const next = colonyData.addColony(profile, { name: '  Bee  ', notes: 'n', today: '2026-05-01' })
    expect(next.colonies.at(-1)).toEqual({
      id: 'col-4', name: 'Bee', createdAt: '2026-05-01', notes: 'n', queenIntroducedAt: null, harvestLog: [],
    })
    expect(profile.colonies).toHaveLength(1)
  })

  it('names a blank Colony after its position', () => {
    expect(colonyData.addColony(profile, { name: '   ', today: 'd' }).colonies.at(-1).name).toBe('Hive 2')
  })

  it('updates and removes only the addressed Colony', () => {
    const two = colonyData.addColony(profile, { name: 'B', today: 'd' })
    expect(colonyData.updateColony(two, 'col-3', { name: 'Z' }).colonies.map((c) => c.name)).toEqual(['Z', 'B'])
    expect(colonyData.removeColony(two, 'col-3').colonies.map((c) => c.id)).toEqual(['col-4'])
  })

  it('treats a profile without colonies as empty', () => {
    expect(colonyData.removeColony({}, 'x').colonies).toEqual([])
  })
})

describe('inspections', () => {
  it('puts a new Inspection first within its Colony and caps the Colony at the newest N', () => {
    const full = Array.from({ length: MAX_INSPECTIONS_PER_COLONY }, (_, i) => inspection(`o${i}`, 'a'))
    const other = inspection('b1', 'b')
    const next = colonyData.addInspection([...full, other], inspection('new', 'a'))
    expect(next.filter((e) => e.colonyId === 'a')).toHaveLength(MAX_INSPECTIONS_PER_COLONY)
    expect(next[0].id).toBe('new')
    expect(next.some((e) => e.id === `o${MAX_INSPECTIONS_PER_COLONY - 1}`)).toBe(false)
    expect(next).toContain(other)
  })

  it('patches an Inspection but never its id or createdAt', () => {
    const outcome = colonyData.updateInspection([inspection('i', 'a')], 'i', { id: 'x', createdAt: 'y', notes: 'hi' })
    expect(outcome).toEqual({ ok: true, inspections: [inspection('i', 'a', { notes: 'hi' })] })
  })

  it('refuses a move into a full Colony and leaves a move into a roomy one', () => {
    const full = Array.from({ length: MAX_INSPECTIONS_PER_COLONY }, (_, i) => inspection(`f${i}`, 'full'))
    const records = [...full, inspection('m', 'a')]
    expect(colonyData.updateInspection(records, 'm', { colonyId: 'full' })).toEqual({ ok: false, messageKey: 'insp_colony_full' })
    expect(colonyData.updateInspection(records, 'm', { colonyId: 'empty' }).ok).toBe(true)
  })

  it('does not count an edit within the same full Colony as a move', () => {
    const full = Array.from({ length: MAX_INSPECTIONS_PER_COLONY }, (_, i) => inspection(`f${i}`, 'full'))
    expect(colonyData.updateInspection(full, 'f0', { colonyId: 'full', notes: 'x' }).ok).toBe(true)
  })

  it('removes one Inspection or every Inspection of a Colony', () => {
    const records = [inspection('1', 'a'), inspection('2', 'a'), inspection('3', 'b')]
    expect(colonyData.removeInspection(records, '2').map((e) => e.id)).toEqual(['1', '3'])
    expect(colonyData.removeColonyInspections(records, 'a').map((e) => e.id)).toEqual(['3'])
  })
})

describe('task log', () => {
  const task = { id: 't1', name: { de: 'a', en: 'b' } }

  it('completes a task, then undoes it', () => {
    const done = colonyData.toggleTask([], task, { entryId: 'e1', completedAt: '2026-05-01' })
    expect(done.completed).toBe(true)
    expect(done.log).toEqual([{ id: 'e1', schemaVersion: 1, type: 'task', taskId: 't1', taskName: task.name, completedAt: '2026-05-01' }])
    expect(colonyData.completedTaskIds(done.log).has('t1')).toBe(true)
    const undone = colonyData.toggleTask(done.log, task, { entryId: 'e2', completedAt: 'x' })
    expect(undone).toEqual({ log: [], completed: false })
  })

  it('keeps custom entries when undoing a task', () => {
    const log = [{ id: 'c', type: 'custom', text: 't', date: 'd' }]
    const done = colonyData.toggleTask(log, task, { entryId: 'e1', completedAt: 'd' })
    expect(colonyData.toggleTask(done.log, task, { entryId: 'e2', completedAt: 'd' }).log).toEqual(log)
  })

  it('caps the log at the newest entries', () => {
    const log = Array.from({ length: MAX_TASK_LOG_ENTRIES }, (_, i) => ({ id: `c${i}`, type: 'custom', text: '', date: 'd' }))
    expect(colonyData.addCustomEntry(log, { entryId: 'n', text: 'x', date: 'd' })).toHaveLength(MAX_TASK_LOG_ENTRIES)
    expect(colonyData.toggleTask(log, task, { entryId: 'e', completedAt: 'd' }).log).toHaveLength(MAX_TASK_LOG_ENTRIES)
  })

  it('deletes by id and sorts newest first across entry kinds', () => {
    const log = [
      { id: 'a', type: 'custom', text: '', date: '2026-01-01' },
      { id: 'b', type: 'task', taskId: 't', completedAt: '2026-03-01' },
      { id: 'c', type: 'custom', text: '', date: '2026-02-01' },
    ]
    expect(colonyData.sortLogNewestFirst(log).map((e) => e.id)).toEqual(['b', 'c', 'a'])
    expect(colonyData.deleteLogEntry(log, 'b').map((e) => e.id)).toEqual(['a', 'c'])
    expect(log.map((e) => e.id)).toEqual(['a', 'b', 'c'])
  })
})
