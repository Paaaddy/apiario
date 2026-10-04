import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { groupByColony, latestByColony, latestOverall, parseInspectionDate, inspectionAgeDays, localDateString } from './inspections'
import { buildColonyRecord } from './colonyRecords'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useInspections } from '../hooks/useInspections'

const c1a = { colonyId: 'c1', date: '2026-05-01', notes: 'a' }
const c1b = { colonyId: 'c1', date: '2026-05-10', notes: 'b' }
const c2a = { colonyId: 'c2', date: '2026-05-05', notes: 'c' }

describe('Colony record chronology', () => {
  it('selects globally from each Colony’s latest observation without disturbing cross-Colony input ties', () => {
    const early = { id: 'early', colonyId: 'a', date: '2026-05-01', createdAt: '2026-05-01T08:00:00Z', queenStatus: 'not_seen' }
    const later = { ...early, id: 'later', createdAt: '2026-05-01T09:00:00Z', queenStatus: 'seen' }
    const other = { id: 'other', colonyId: 'b', date: '2026-05-01' }
    const inspections = [early, other, later]
    expect(latestByColony(inspections).get('a')).toBe(later)
    expect(latestOverall(inspections)).toBe(other)
    expect(buildColonyRecord({ id: 'a' }, inspections).latestInspection).toBe(later)
  })

  it('uses the selected Inspection position rather than its Colony’s first appearance for ambiguous global ties', () => {
    const oldApple = { colonyId: 'a', date: '2026-04-01' }
    const birch = { colonyId: 'b', date: '2026-05-01' }
    const apple = { colonyId: 'a', date: '2026-05-01' }
    expect(latestOverall([oldApple, birch, apple])).toBe(birch)
  })

  it('preserves ambiguous same-day metric observations in their existing order', () => {
    const inspections = [
      { ...c1a, varroa: 1 },
      { ...c1a, varroa: 2 },
      { ...c1a, varroa: 3 },
    ]
    expect(buildColonyRecord({ id: 'c1' }, inspections).metrics.varroa.points).toEqual([
      { date: '2026-05-01', value: 1 },
      { date: '2026-05-01', value: 2 },
      { date: '2026-05-01', value: 3 },
    ])
  })

  it('keeps creation chronology on note edits and exposes no latest for undated colonies', () => {
    const early = { ...c1a, id: 'early', createdAt: '2026-05-01T08:00:00Z' }
    const later = { ...c1a, id: 'later', createdAt: '2026-05-01T09:00:00Z' }
    localStorage.setItem('apiario-inspections', JSON.stringify([early, later, { colonyId: 'undated', date: [] }]))
    try {
      const { result } = renderHook(() => useInspections())
      act(() => result.current.updateInspection('early', { notes: 'corrected', createdAt: '2099-01-01T00:00:00Z' }))
      expect(result.current.getColonyInspections('c1').map((inspection) => inspection.id)).toEqual(['later', 'early'])
      expect(result.current.getColonyInspections('c1')[1].createdAt).toBe(early.createdAt)
      expect(result.current.getLatestInspection('undated')).toBeNull()
    } finally {
      cleanup()
      localStorage.clear()
    }
  })
  it('shares latest history and excludes invalid dates only from dated metrics', () => {
    const invalid = { colonyId: 'c1', date: '2026-02-29', varroa: 8, harvest: 3 }
    const early = { ...c1a, createdAt: '2026-05-01T08:00:00Z', varroa: 1, harvest: 2 }
    const later = { ...early, createdAt: '2026-05-01T09:00:00Z', varroa: 2 }
    const record = buildColonyRecord({ id: 'c1' }, [early, invalid, later], { today: new Date(2026, 4, 2, 0, 15) })
    expect(record.history).toEqual([later, early, invalid])
    expect(record.latestInspection).toBe(later)
    expect(record.lastInspected).toEqual({ kind: 'yesterday' })
    expect(record.metrics.varroa.points).toEqual([{ date: '2026-05-01', value: 1 }, { date: '2026-05-01', value: 2 }])
    expect(record.inspectionCount).toBe(3)
    expect(record.totalHarvestKg).toBe(7)
    const undated = buildColonyRecord({ id: 'c1' }, [invalid])
    expect(undated.latestInspection).toBeNull()
    expect(undated.lastInspected).toEqual({ kind: 'never' })
    expect(undated.metrics.varroa.points).toEqual([])
  })
})

describe('Inspection calendar dates', () => {
  it.each([
    ['Europe/Berlin', '2026-03-30', 1],
    ['America/Los_Angeles', '2026-03-29', 0],
  ])('interprets the same instant using calendar days in %s regardless of the test host', (timezone, date, age) => {
    const script = `
      import { localDateString, inspectionAgeDays } from './src/utils/inspections.js';
      const now = new Date('2026-03-29T22:15:00Z');
      console.log(JSON.stringify({ date: localDateString(now), age: inspectionAgeDays('2026-03-29', now) }));
    `
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, TZ: timezone }, encoding: 'utf8',
    })
    expect(JSON.parse(output)).toEqual({ date, age })
  })

  it('uses local calendar days across midnight and DST, clamping future ages', () => {
    // Run with TZ=Europe/Berlin: midnight is still the previous UTC date.
    expect(localDateString(new Date(2026, 2, 30, 0, 15))).toBe('2026-03-30')
    expect(inspectionAgeDays('2026-03-29', new Date(2026, 2, 30, 0, 15))).toBe(1)
    expect(inspectionAgeDays('2026-10-25', new Date(2026, 9, 26, 23, 45))).toBe(1)
    expect(inspectionAgeDays('2026-05-02', new Date(2026, 4, 1, 23, 59))).toBe(0)
    expect(inspectionAgeDays('2026-02-29', new Date(2026, 4, 1))).toBeNull()
    expect(inspectionAgeDays('2026-05-01', '2026-05-03')).toBe(2)
    expect(inspectionAgeDays('2026-05-01', new Date(NaN))).toBeNull()
  })
  it('accepts only exact real calendar dates without normalizing imported values', () => {
    for (const value of [undefined, null, 0, [], ['2026-05-01'], {}, '', '2026-2-01', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-05-00', '2026-05-01T00:00:00Z']) {
      expect(parseInspectionDate(value)).toBeNull()
    }
    const leap = parseInspectionDate('2024-02-29')
    expect([leap.getFullYear(), leap.getMonth(), leap.getDate(), leap.getHours()]).toEqual([2024, 1, 29, 0])
    expect(parseInspectionDate('0099-01-01').getFullYear()).toBe(99)
  })
})

describe('groupByColony', () => {
  it('prefers later creation on equal dates while preserving equal and unusable creation order', () => {
    const entry = (id, createdAt) => ({ id, colonyId: 'c1', date: '2026-05-01', createdAt })
    const early = entry('early', '2026-05-01T08:00:00Z')
    const later = entry('later', '2026-05-01T09:00:00Z')
    const equal = entry('equal', later.createdAt)
    expect(groupByColony([early, later, equal]).get('c1')).toEqual([later, equal, early])
    expect(latestByColony([early, later]).get('c1')).toBe(later)
    expect(latestOverall([early, later])).toBe(later)
    for (const createdAt of [undefined, null, '', 'invalid', [], {}]) {
      const unknown = entry('unknown', createdAt)
      const input = [early, unknown, later]
      expect(groupByColony(input).get('c1')).toEqual(input)
      expect(latestOverall(input)).toBe(early)
    }
  })
  it('retains invalid dates stably after dated history but never selects them as latest', () => {
    const invalid = [undefined, null, [], {}, '2026-02-29', 'garbage'].map((date, i) => ({ colonyId: 'c1', date, id: `invalid-${i}` }))
    const undated = { colonyId: 'c3', date: ['2026-05-01'] }
    const future = { colonyId: 'c2', date: '2099-01-01' }
    const input = [invalid[0], c1a, ...invalid.slice(1), undated, c1b, future]
    const snapshot = structuredClone(input)
    expect(groupByColony(input).get('c1')).toEqual([c1b, c1a, ...invalid])
    expect(latestByColony(input)).toEqual(new Map([['c1', c1b], ['c2', future]]))
    expect(latestOverall(input)).toBe(future)
    expect(latestOverall(invalid)).toBeNull()
    expect(input).toEqual(snapshot)
  })
  it('groups inspections by colonyId, sorted descending by date', () => {
    const map = groupByColony([c1a, c2a, c1b])
    expect(map.get('c1')).toEqual([c1b, c1a])
    expect(map.get('c2')).toEqual([c2a])
  })

  it('returns an empty map for no inspections', () => {
    expect(groupByColony([]).size).toBe(0)
  })
})

describe('latestByColony', () => {
  it('maps each colony to its single most recent inspection', () => {
    const map = latestByColony([c1a, c2a, c1b])
    expect(map.get('c1')).toEqual(c1b)
    expect(map.get('c2')).toEqual(c2a)
  })

  it('returns an empty map for no inspections', () => {
    expect(latestByColony([]).size).toBe(0)
  })
})

describe('latestOverall', () => {
  it('returns the most recent inspection across all colonies', () => {
    expect(latestOverall([c1a, c2a, c1b])).toEqual(c1b)
  })

  it('returns null for no inspections', () => {
    expect(latestOverall([])).toBeNull()
  })
})
