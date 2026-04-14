import { describe, it, expect } from 'vitest'
import {
  getCurrentSeason,
  getSeasonWeek,
  getIsoWeek,
  getIsoWeekAndYear,
  getIsoWeekRange,
  addWeeks,
  isSameIsoWeek,
} from './season'

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

describe('getIsoWeek (ISO 8601 calendar week)', () => {
  // Reference values verified against https://en.wikipedia.org/wiki/ISO_week_date
  it('returns 16 for 2026-04-14 (the user reported this as the correct week)', () => {
    expect(getIsoWeek(new Date('2026-04-14'))).toBe(16)
  })
  it('returns 1 for 2026-01-01 (Thursday — belongs to week 1 of 2026)', () => {
    expect(getIsoWeek(new Date('2026-01-01'))).toBe(1)
  })
  it('returns 53 for 2020-12-31 (2020 had 53 ISO weeks)', () => {
    expect(getIsoWeek(new Date('2020-12-31'))).toBe(53)
  })
  it('returns 1 for 2024-01-01 (Monday — first day of week 1)', () => {
    expect(getIsoWeek(new Date('2024-01-01'))).toBe(1)
  })
  it('returns 52 for 2023-01-01 (Sunday — still inside 2022-W52)', () => {
    const [year, week] = getIsoWeekAndYear(new Date('2023-01-01'))
    expect(year).toBe(2022)
    expect(week).toBe(52)
  })
  it('returns 26 for 2026-06-23 (mid-year sanity check)', () => {
    expect(getIsoWeek(new Date('2026-06-23'))).toBe(26)
  })
})

describe('getIsoWeekRange', () => {
  it('returns Monday-to-Sunday for a Tuesday in the middle of the week', () => {
    // 2026-04-14 is a Tuesday of ISO week 16
    const { start, end } = getIsoWeekRange(new Date('2026-04-14'))
    // Monday is 2026-04-13, Sunday is 2026-04-19
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(3) // April
    expect(start.getDate()).toBe(13)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(3)
    expect(end.getDate()).toBe(19)
  })

  it('returns Monday through Sunday when the date IS a Monday', () => {
    const { start, end } = getIsoWeekRange(new Date('2026-04-13'))
    expect(start.getDate()).toBe(13)
    expect(end.getDate()).toBe(19)
  })

  it('returns Monday through Sunday when the date IS a Sunday', () => {
    const { start, end } = getIsoWeekRange(new Date('2026-04-19'))
    expect(start.getDate()).toBe(13)
    expect(end.getDate()).toBe(19)
  })
})

describe('addWeeks', () => {
  it('moves a date forward by the given number of whole weeks', () => {
    const base = new Date('2026-04-14T10:00:00Z')
    const later = addWeeks(base, 2)
    expect(later.getUTCDate()).toBe(28)
    expect(later.getUTCMonth()).toBe(3)
  })

  it('moves a date backward for negative offsets', () => {
    const base = new Date('2026-04-14T10:00:00Z')
    const earlier = addWeeks(base, -3)
    // Apr 14 - 21 days = Mar 24
    expect(earlier.getUTCDate()).toBe(24)
    expect(earlier.getUTCMonth()).toBe(2)
  })

  it('returns a new Date without mutating the input', () => {
    const base = new Date('2026-04-14T00:00:00Z')
    const baseTime = base.getTime()
    addWeeks(base, 5)
    expect(base.getTime()).toBe(baseTime)
  })
})

describe('isSameIsoWeek', () => {
  it('returns true for two dates in the same ISO week', () => {
    expect(isSameIsoWeek(new Date('2026-04-13'), new Date('2026-04-19'))).toBe(true)
  })
  it('returns false for adjacent ISO weeks', () => {
    expect(isSameIsoWeek(new Date('2026-04-12'), new Date('2026-04-13'))).toBe(false)
  })
  it('handles the year boundary correctly', () => {
    // 2022-12-31 (Saturday) is in 2022-W52
    // 2023-01-01 (Sunday) is still in 2022-W52
    expect(isSameIsoWeek(new Date('2022-12-31'), new Date('2023-01-01'))).toBe(true)
    // 2023-01-02 (Monday) is in 2023-W1
    expect(isSameIsoWeek(new Date('2023-01-01'), new Date('2023-01-02'))).toBe(false)
  })
})
