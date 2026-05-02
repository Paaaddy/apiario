import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInspections } from './useInspections'

beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

describe('useInspections', () => {
  it('starts with empty inspections', () => {
    const { result } = renderHook(() => useInspections())
    expect(result.current.inspections).toEqual([])
    expect(result.current.inspectionCount).toBe(0)
  })

  it('adds an inspection and persists it', () => {
    const { result } = renderHook(() => useInspections())
    act(() => {
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' })
    })
    expect(result.current.inspections).toHaveLength(1)
    expect(result.current.inspections[0].colonyId).toBe('c1')
    expect(result.current.inspections[0].queenStatus).toBe('seen')
    expect(result.current.inspections[0].id).toBeDefined()
    expect(result.current.inspections[0].createdAt).toBeDefined()
    const stored = JSON.parse(localStorage.getItem('apiario-inspections'))
    expect(stored).toHaveLength(1)
  })

  it('updates an inspection immutably', () => {
    const { result } = renderHook(() => useInspections())
    act(() => {
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' })
    })
    const id = result.current.inspections[0].id
    act(() => {
      result.current.updateInspection(id, { queenStatus: 'not_seen', notes: 'missing' })
    })
    expect(result.current.inspections[0].queenStatus).toBe('not_seen')
    expect(result.current.inspections[0].notes).toBe('missing')
    expect(result.current.inspections[0].id).toBe(id)
  })

  it('removes an inspection', () => {
    const { result } = renderHook(() => useInspections())
    act(() => {
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' })
    })
    const id = result.current.inspections[0].id
    act(() => {
      result.current.removeInspection(id)
    })
    expect(result.current.inspections).toHaveLength(0)
  })

  it('removes all inspections for a colony (cascade delete)', () => {
    const { result } = renderHook(() => useInspections())
    act(() => {
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' })
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-02', queenStatus: 'eggs' })
      result.current.addInspection({ colonyId: 'c2', date: '2026-05-01', queenStatus: 'larvae' })
    })
    act(() => {
      result.current.removeInspectionsByColonyId('c1')
    })
    expect(result.current.inspections).toHaveLength(1)
    expect(result.current.inspections[0].colonyId).toBe('c2')
  })

  it('getColonyInspections returns sorted descending', () => {
    const { result } = renderHook(() => useInspections())
    act(() => {
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' })
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-10', queenStatus: 'eggs' })
    })
    const list = result.current.getColonyInspections('c1')
    expect(list[0].date).toBe('2026-05-10')
    expect(list[1].date).toBe('2026-05-01')
  })

  it('getLatestInspection returns the most recent', () => {
    const { result } = renderHook(() => useInspections())
    act(() => {
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' })
      result.current.addInspection({ colonyId: 'c1', date: '2026-05-10', queenStatus: 'eggs' })
    })
    const latest = result.current.getLatestInspection('c1')
    expect(latest.date).toBe('2026-05-10')
  })

  it('getLatestInspection returns null for colony with no inspections', () => {
    const { result } = renderHook(() => useInspections())
    expect(result.current.getLatestInspection('c-nonexistent')).toBeNull()
  })

  it('loads existing data from localStorage on mount', () => {
    const existing = [{ id: 'insp-1', colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen', createdAt: '2026-05-01T10:00:00Z' }]
    localStorage.setItem('apiario-inspections', JSON.stringify(existing))
    const { result } = renderHook(() => useInspections())
    expect(result.current.inspections).toHaveLength(1)
    expect(result.current.inspections[0].id).toBe('insp-1')
  })

  it('gracefully handles corrupt localStorage data', () => {
    localStorage.setItem('apiario-inspections', 'not-valid-json{{{')
    const { result } = renderHook(() => useInspections())
    expect(result.current.inspections).toEqual([])
  })
})
