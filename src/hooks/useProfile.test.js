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
      schemaVersion: 2,
      hiveCount: null,
      climateZone: null,
      experience: null,
      onboardingDone: false,
      colonies: [],
    })
  })

  it('loads an existing v2 profile from localStorage unchanged', () => {
    const saved = {
      schemaVersion: 2,
      hiveCount: 2,
      climateZone: 'central',
      experience: 1,
      onboardingDone: true,
      colonies: [{ id: 'col-1', name: 'Apple tree', createdAt: '2026-03-01', notes: '' }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile).toEqual(saved)
  })

  it('migrates a v0 profile (no schemaVersion) all the way to the current schema', () => {
    const legacy = { hiveCount: 2, climateZone: 'northern', experience: 0, onboardingDone: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile.schemaVersion).toBe(2)
    expect(result.current.profile.hiveCount).toBe(2)
    expect(result.current.profile.colonies).toHaveLength(2)
    expect(result.current.profile.colonies[0]).toMatchObject({
      id: 'col-1',
      name: 'Hive 1',
    })
    expect(result.current.profile.colonies[1]).toMatchObject({
      id: 'col-2',
      name: 'Hive 2',
    })
  })

  it('migrates a v1 profile by seeding colonies from hiveCount', () => {
    const v1 = { schemaVersion: 1, hiveCount: 3, climateZone: 'central', experience: 0, onboardingDone: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1))
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile.schemaVersion).toBe(2)
    expect(result.current.profile.colonies).toHaveLength(3)
  })

  it('migrates a v1 profile with null hiveCount to an empty colonies array', () => {
    const v1 = { schemaVersion: 1, hiveCount: null, climateZone: null, experience: null, onboardingDone: false }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1))
    const { result } = renderHook(() => useProfile())
    expect(result.current.profile.schemaVersion).toBe(2)
    expect(result.current.profile.colonies).toEqual([])
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

  describe('addColony', () => {
    it('appends a new colony with an auto-generated id and default name', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony() })
      expect(result.current.profile.colonies).toHaveLength(1)
      expect(result.current.profile.colonies[0]).toMatchObject({
        id: 'col-1',
        name: 'Hive 1',
        notes: '',
      })
      expect(result.current.profile.colonies[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('trims whitespace and uses provided name and notes', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony('  Apple tree  ', 'Next to the south wall') })
      expect(result.current.profile.colonies[0]).toMatchObject({
        name: 'Apple tree',
        notes: 'Next to the south wall',
      })
    })

    it('generates unique ids even after a colony has been removed', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony('A') })
      act(() => { result.current.addColony('B') })
      act(() => { result.current.addColony('C') })
      act(() => { result.current.removeColony('col-2') })
      act(() => { result.current.addColony('D') })
      const ids = result.current.profile.colonies.map((c) => c.id)
      expect(ids).toEqual(['col-1', 'col-3', 'col-4'])
    })

    it('persists colonies to localStorage', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony('Apple tree') })
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.colonies[0].name).toBe('Apple tree')
    })
  })

  describe('updateColony', () => {
    it('patches an existing colony by id', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony('Apple tree') })
      act(() => { result.current.updateColony('col-1', { name: 'Apple tree ⭐' }) })
      expect(result.current.profile.colonies[0].name).toBe('Apple tree ⭐')
    })

    it('leaves other colonies untouched', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony('A') })
      act(() => { result.current.addColony('B') })
      act(() => { result.current.updateColony('col-2', { notes: 'Needs requeening' }) })
      expect(result.current.profile.colonies[0].notes).toBe('')
      expect(result.current.profile.colonies[1].notes).toBe('Needs requeening')
    })
  })

  describe('removeColony', () => {
    it('removes the colony with the given id', () => {
      const { result } = renderHook(() => useProfile())
      act(() => { result.current.addColony('A') })
      act(() => { result.current.addColony('B') })
      act(() => { result.current.removeColony('col-1') })
      expect(result.current.profile.colonies).toHaveLength(1)
      expect(result.current.profile.colonies[0].id).toBe('col-2')
    })
  })
})
