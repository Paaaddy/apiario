import { describe, it, expect } from 'vitest'
import { getCurrentSeason, getSeasonWeek } from './season'

describe('getCurrentSeason', () => {
  it('returns spring for March', () => {
    expect(getCurrentSeason(new Date('2026-03-15'))).toBe('spring')
  })
  it('returns spring for May', () => {
    expect(getCurrentSeason(new Date('2026-05-01'))).toBe('spring')
  })
  it('returns summer for June', () => {
    expect(getCurrentSeason(new Date('2026-06-01'))).toBe('summer')
  })
  it('returns summer for August', () => {
    expect(getCurrentSeason(new Date('2026-08-31'))).toBe('summer')
  })
  it('returns autumn for September', () => {
    expect(getCurrentSeason(new Date('2026-09-01'))).toBe('autumn')
  })
  it('returns autumn for November', () => {
    expect(getCurrentSeason(new Date('2026-11-15'))).toBe('autumn')
  })
  it('returns winter for December', () => {
    expect(getCurrentSeason(new Date('2026-12-01'))).toBe('winter')
  })
  it('returns winter for January', () => {
    expect(getCurrentSeason(new Date('2026-01-20'))).toBe('winter')
  })
  it('returns winter for February', () => {
    expect(getCurrentSeason(new Date('2026-02-28'))).toBe('winter')
  })
})

describe('getSeasonWeek', () => {
  it('returns week 1 for March 1 (first day of spring)', () => {
    expect(getSeasonWeek(new Date('2026-03-01'))).toBe(1)
  })
  it('returns week 4 for March 22', () => {
    expect(getSeasonWeek(new Date('2026-03-22'))).toBe(4)
  })
  it('returns week 1 for June 1 (first day of summer)', () => {
    expect(getSeasonWeek(new Date('2026-06-01'))).toBe(1)
  })
  it('returns week 1 for December 1 (first day of winter)', () => {
    expect(getSeasonWeek(new Date('2026-12-01'))).toBe(1)
  })
  it('returns week 5 for January 1 (continuation of winter)', () => {
    expect(getSeasonWeek(new Date('2026-01-01'))).toBe(5)
  })
})
