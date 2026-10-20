import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useColonyRecords, useSelectedColonyRecord } from './useColonyRecords'

const colonies = [
  { id: 'a', name: 'Apple' },
  { id: 'b', name: 'Birch' },
  { id: 'c', name: 'Cherry' },
]
const inspections = [
  { id: 'i1', colonyId: 'a', date: '2026-05-01', varroa: 2 },
  { id: 'i2', colonyId: 'a', date: '2026-06-01', varroa: 3 },
  { id: 'i3', colonyId: 'b', date: '2026-05-20', varroa: 1 },
]

describe('useColonyRecords', () => {
  it('derives one record per colony, each with only its own history', () => {
    const { result } = renderHook(() => useColonyRecords(colonies, inspections))
    expect(result.current.map((record) => record.colony.id)).toEqual(['a', 'b', 'c'])
    expect(result.current[0].history.map((inspection) => inspection.id)).toEqual(['i2', 'i1'])
    expect(result.current[0].inspectionCount).toBe(2)
    expect(result.current[0].metrics.varroa.points).toEqual([
      { date: '2026-05-01', value: 2 },
      { date: '2026-06-01', value: 3 },
    ])
    expect(result.current[1].history.map((inspection) => inspection.id)).toEqual(['i3'])
    expect(result.current[2].history).toEqual([])
    expect(result.current[2].lastInspected).toEqual({ kind: 'never' })
  })

  it('keeps the same records while the inputs are unchanged', () => {
    const { result, rerender } = renderHook(() => useColonyRecords(colonies, inspections))
    const first = result.current
    rerender()
    rerender()
    expect(result.current).toBe(first)
  })

  it('derives again when the colonies or the inspections change', () => {
    const { result, rerender } = renderHook(
      ({ colonies: nextColonies, inspections: nextInspections }) =>
        useColonyRecords(nextColonies, nextInspections),
      { initialProps: { colonies, inspections } }
    )
    const first = result.current
    rerender({ colonies, inspections: [...inspections, { id: 'i4', colonyId: 'b', date: '2026-07-01' }] })
    expect(result.current).not.toBe(first)
    expect(result.current[1].inspectionCount).toBe(2)
    rerender({ colonies: colonies.slice(0, 2), inspections })
    expect(result.current.map((record) => record.colony.id)).toEqual(['a', 'b'])
  })

  it('accepts an explicit today for the last-inspected status', () => {
    const { result } = renderHook(() => useColonyRecords(colonies, inspections, new Date('2026-06-02')))
    expect(result.current[0].lastInspected).toEqual({ kind: 'yesterday' })
    expect(result.current[1].lastInspected).toEqual({ kind: 'daysAgo', days: 13 })
  })

  it('handles no colonies and no inspections', () => {
    const { result } = renderHook(() => useColonyRecords())
    expect(result.current).toEqual([])
  })
})

describe('useSelectedColonyRecord', () => {
  it('returns the record of the selected colony', () => {
    const { result: records } = renderHook(() => useColonyRecords(colonies, inspections))
    const { result: selected } = renderHook(() => useSelectedColonyRecord(records.current, 'b'))
    expect(selected.current.colony.name).toBe('Birch')
    expect(selected.current.history.map((inspection) => inspection.id)).toEqual(['i3'])
  })

  it('returns null for an unknown colony or no selection', () => {
    const { result: records } = renderHook(() => useColonyRecords(colonies, inspections))
    const { result: missing } = renderHook(() => useSelectedColonyRecord(records.current, 'missing'))
    const { result: none } = renderHook(() => useSelectedColonyRecord(records.current, null))
    const { result: undefinedId } = renderHook(() => useSelectedColonyRecord(records.current))
    expect(missing.current).toBeNull()
    expect(none.current).toBeNull()
    expect(undefinedId.current).toBeNull()
  })

  it('keeps the same record while the selection is unchanged', () => {
    const { result: records } = renderHook(() => useColonyRecords(colonies, inspections))
    const { result: selected, rerender } = renderHook(
      ({ colonyId }) => useSelectedColonyRecord(records.current, colonyId),
      { initialProps: { colonyId: 'a' } }
    )
    const first = selected.current
    rerender({ colonyId: 'a' })
    expect(selected.current).toBe(first)
    rerender({ colonyId: 'b' })
    expect(selected.current).not.toBe(first)
    expect(selected.current.colony.name).toBe('Birch')
  })
})
