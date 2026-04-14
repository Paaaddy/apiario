import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProfile } from './useProfile'

const STORAGE_KEY = 'apiario-profile'

beforeEach(() => {
  localStorage.clear()
})

describe('useProfile', () => {
  it('returns default profile when localStorage is empty', () => {
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile).toEqual({
      schemaVersion: 1,
      hiveCount: null,
      climateZone: null,
      experience: null,
      onboardingDone: false,
    })
  })

  it('loads existing profile from localStorage', () => {
    const saved = { schemaVersion: 1, hiveCount: 2, climateZone: 'central', experience: 1, onboardingDone: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile).toEqual(saved)
  })

  it('migrates v0 profile (no schemaVersion) to current schema', () => {
    const legacy = { hiveCount: 1, climateZone: 'northern', experience: 0, onboardingDone: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile.schemaVersion).toBe(1)
    expect(result.current.profile.hiveCount).toBe(1)
    expect(result.current.profile.onboardingDone).toBe(true)
  })

  it('updateProfile merges partial updates', () => {
    const { result } = renderHook(() => useProfile())
    act(() => { result.current.updateProfile({ hiveCount: 3 }) })
    expect(result.current.profile.hiveCount).toBe(3)
    expect(result.current.profile.onboardingDone).toBe(false)
  })

  it('updateProfile persists to localStorage', () => {
    const { result } = renderHook(() => useProfile())
    act(() => {
      result.current.updateProfile({ hiveCount: 1, climateZone: 'northern', experience: 0, onboardingDone: true })
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.hiveCount).toBe(1)
    expect(stored.onboardingDone).toBe(true)
  })
})
