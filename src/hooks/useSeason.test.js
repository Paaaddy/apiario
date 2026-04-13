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
})
