import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSeason } from './useSeason'

afterEach(() => vi.useRealTimers())

describe('useSeason', () => {
  it('returns the correct season for the mocked date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 0 })
    )
    expect(result.current.season).toBe('spring')
  })

  it('returns label and icon for the season', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 0 })
    )
    expect(result.current.label).toEqual({ de: 'Frühling', en: 'Spring' })
    expect(result.current.icon).toBe('🌸')
  })

  it('filters out tasks above the user experience level', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 0 })
    )
    result.current.tasks.forEach((task) => {
      expect(task.minExperience).toBeLessThanOrEqual(0)
    })
  })

  it('returns more tasks for experienced keeper than beginner', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result: beginnerResult } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 0 })
    )
    const { result: experiencedResult } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 1 })
    )
    expect(experiencedResult.current.tasks.length).toBeGreaterThanOrEqual(
      beginnerResult.current.tasks.length
    )
  })

  it('returns a positive week number', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 0 })
    )
    expect(result.current.week).toBeGreaterThan(0)
  })

  it('hides secret tasks whose unlockAt is above the completed count', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    // experienced keeper so minExperience gates don't interfere
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 2 }, 0)
    )
    const secretTasks = result.current.tasks.filter((task) => task.secret)
    expect(secretTasks.every((task) => (task.unlockAt ?? 0) <= 0)).toBe(true)
  })

  it('reveals secret tasks once the completed count reaches their unlockAt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result: locked } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 2 }, 0)
    )
    const { result: unlocked } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 2 }, 99)
    )
    const lockedSecretCount = locked.current.tasks.filter((t) => t.secret).length
    const unlockedSecretCount = unlocked.current.tasks.filter((t) => t.secret).length
    expect(unlockedSecretCount).toBeGreaterThan(lockedSecretCount)
  })

  it('exposes the next locked secret task for the season', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 2 }, 0)
    )
    expect(result.current.nextLockedSecret).not.toBeNull()
    expect(result.current.nextLockedSecret.secret).toBe(true)
    // spring has secrets at 1 and 3, so the next one at count=0 should be unlockAt=1
    expect(result.current.nextLockedSecret.unlockAt).toBe(1)
  })

  it('nextLockedSecret is null once every secret in the season is unlocked', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13'))
    const { result } = renderHook(() =>
      useSeason({ hiveCount: 1, climateZone: 'central', experience: 2 }, 99)
    )
    expect(result.current.nextLockedSecret).toBeNull()
  })
})
