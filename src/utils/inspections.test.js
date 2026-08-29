import { describe, it, expect } from 'vitest'
import { groupByColony, latestByColony, latestOverall } from './inspections'

const c1a = { colonyId: 'c1', date: '2026-05-01', notes: 'a' }
const c1b = { colonyId: 'c1', date: '2026-05-10', notes: 'b' }
const c2a = { colonyId: 'c2', date: '2026-05-05', notes: 'c' }

describe('groupByColony', () => {
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
