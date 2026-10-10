import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInspections } from './useInspections'
import { MAX_INSPECTIONS_PER_COLONY } from '../utils/retentionLimits'

beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

describe('useInspections', () => {
  it('rejects invalid ordinary additions and edits before state or storage changes', () => {
    const { result } = renderHook(() => useInspections())
    let outcome
    act(() => { outcome = result.current.addInspection({ colonyId: 'a', harvest: -1 }) })
    expect(outcome).toMatchObject({ ok: false, error: 'validation' })
    expect(result.current.inspections).toEqual([])
    expect(localStorage.getItem('apiario-inspections')).toBeNull()
    act(() => result.current.addInspection({ colonyId: 'a', queenStatus: 'seen', date: false }))
    const before = localStorage.getItem('apiario-inspections')
    act(() => { outcome = result.current.updateInspection(result.current.inspections[0].id, { harvest: Infinity }) })
    expect(outcome).toMatchObject({ ok: false, error: 'validation' })
    expect(localStorage.getItem('apiario-inspections')).toBe(before)
    expect(result.current.inspections[0].harvest).toBeUndefined()
  })

  it('rejects a move into a full Colony without deleting either history', () => {
    const existing = Array.from({ length: MAX_INSPECTIONS_PER_COLONY }, (_, i) => ({
      id: `full-${i}`, colonyId: 'full', date: '2026-05-01', queenStatus: 'seen',
    }))
    existing.push({ id: 'moving', colonyId: 'source', date: 'bad-but-recoverable', createdAt: 'original' })
    localStorage.setItem('apiario-inspections', JSON.stringify(existing))
    const { result } = renderHook(() => useInspections())
    let outcome
    act(() => { outcome = result.current.updateInspection('moving', { colonyId: 'full' }) })
    expect(outcome).toMatchObject({ ok: false, messageKey: 'insp_colony_full' })
    expect(result.current.inspections).toEqual(existing)
    expect(JSON.parse(localStorage.getItem('apiario-inspections'))).toEqual(existing)
    act(() => result.current.updateInspection('moving', { notes: 'Retained', id: 'changed', createdAt: 'changed' }))
    expect(result.current.inspections.at(-1)).toMatchObject({ id: 'moving', createdAt: 'original', notes: 'Retained' })
  })

  it('keeps structurally unsafe source data recoverable instead of overwriting it on edits or retry', () => {
    const raw = JSON.stringify([null, { id: 'recover', colonyId: 'a', date: false }])
    localStorage.setItem('apiario-inspections', raw)
    const { result } = renderHook(() => useInspections())
    expect(result.current.persistenceError).toMatchObject({ messageKey: 'storage_invalid' })
    act(() => result.current.addInspection({ colonyId: 'a', queenStatus: 'seen' }))
    act(() => result.current.retrySave())
    expect(localStorage.getItem('apiario-inspections')).toBe(raw)
  })

  it('allows moving into available space and preserves all other records and safe invalid dates', () => {
    const existing = [
      { id: 'moving', colonyId: 'source', date: false, createdAt: 'old', extra: { retained: true } },
      { id: 'other', colonyId: 'other', date: '2026-05-01' },
    ]
    localStorage.setItem('apiario-inspections', JSON.stringify(existing))
    const { result } = renderHook(() => useInspections())
    act(() => result.current.updateInspection('moving', { colonyId: 'target' }))
    expect(result.current.inspections).toEqual([{ ...existing[0], colonyId: 'target' }, existing[1]])
    expect(JSON.parse(localStorage.getItem('apiario-inspections'))).toEqual(result.current.inspections)
  })

  it('starts with empty inspections', () => {
    const { result } = renderHook(() => useInspections())
    expect(result.current.inspections).toEqual([])
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
