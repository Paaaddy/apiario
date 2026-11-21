import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useDiagnosisFlow } from './useDiagnosisFlow'
import { DIAGNOSIS_PATH_KEY } from '../utils/diagnosisPath'

const tree = {
  root: {
    type: 'question',
    question: { en: 'Root', de: 'Root' },
    options: [
      { label: { en: 'A', de: 'A' }, next: 'a' },
      { label: { en: 'B', de: 'B' }, next: 'b' },
    ],
  },
  a: {
    type: 'outcome',
    diagnosis: { en: 'A', de: 'A' },
    actions: [{ en: 'Act', de: 'Act' }],
  },
  b: {
    type: 'question',
    question: { en: 'B?', de: 'B?' },
    options: [
      { label: { en: 'Short', de: 'Short' }, next: 'a' },
      { label: { en: 'Long', de: 'Long' }, next: 'c' },
    ],
  },
  c: {
    type: 'question',
    question: { en: 'C?', de: 'C?' },
    options: [{ label: { en: 'Done', de: 'Done' }, next: 'a' }],
  },
  queenless: {
    type: 'outcome',
    diagnosis: { en: 'Queenless', de: 'Queenless' },
    actions: [{ en: 'Act', de: 'Act' }],
  },
}

describe('useDiagnosisFlow', () => {
  it('selects, resets, and taps through the flow interface', () => {
    const tap = vi.fn()
    const { result } = renderHook(() => useDiagnosisFlow([], { data: tree, tap }))

    act(() => result.current.select('a'))
    expect(result.current.currentNodeId).toBe('a')
    expect(result.current.isOutcome).toBe(true)
    expect(result.current.stepNumber).toBe(2)
    expect(tap).toHaveBeenCalledTimes(1)

    act(() => result.current.reset())
    expect(result.current.currentNodeId).toBe('root')
    expect(result.current.stepNumber).toBe(1)
    expect(tap).toHaveBeenCalledTimes(2)
  })

  it('prefills from the latest Inspection only at the root', () => {
    const tap = vi.fn()
    const inspections = [{ id: 'i1', date: '2026-05-01', queenStatus: 'not_seen' }]
    const { result } = renderHook(() => useDiagnosisFlow(inspections, { data: tree, tap }))

    expect(result.current.canPrefill).toBe(true)
    act(() => result.current.prefill())
    expect(result.current.currentNodeId).toBe('queenless')
    expect(result.current.stepNumber).toBe(2)
    expect(tap).toHaveBeenCalledTimes(1)
  })

  it('steps back exactly one question per press and not past the first', () => {
    const tap = vi.fn()
    const { result } = renderHook(() => useDiagnosisFlow([], { data: tree, tap }))
    expect(result.current.canGoBack).toBe(false)

    act(() => result.current.select('b'))
    act(() => result.current.select('c'))
    expect(result.current.currentNodeId).toBe('c')
    expect(result.current.canGoBack).toBe(true)

    act(() => result.current.back())
    expect(result.current.currentNodeId).toBe('b')
    expect(result.current.history).toEqual(['root'])
    act(() => result.current.back())
    expect(result.current.currentNodeId).toBe('root')
    act(() => result.current.back())
    expect(result.current.currentNodeId).toBe('root')
    expect(result.current.canGoBack).toBe(false)
  })

  it('a mis-tap then back costs one question, not the run', () => {
    const { result } = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    act(() => result.current.select('b'))
    act(() => result.current.select('a'))
    act(() => result.current.back())
    expect(result.current.currentNodeId).toBe('b')
    act(() => result.current.select('c'))
    expect(result.current.history).toEqual(['root', 'b'])
  })

  it('steps back from a prefilled node to the root', () => {
    const inspections = [{ id: 'i1', date: '2026-05-01', queenStatus: 'not_seen' }]
    const { result } = renderHook(() => useDiagnosisFlow(inspections, { data: tree, tap: vi.fn() }))
    act(() => result.current.prefill())
    expect(result.current.currentNodeId).toBe('queenless')
    act(() => result.current.back())
    expect(result.current.currentNodeId).toBe('root')
  })

  it('restores the walk on remount, including after a prefill', () => {
    const first = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    act(() => first.result.current.select('b'))
    first.unmount()

    const second = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    expect(second.result.current.currentNodeId).toBe('b')
    expect(second.result.current.history).toEqual(['root'])
    second.unmount()

    sessionStorage.clear()
    const inspections = [{ id: 'i1', date: '2026-05-01', queenStatus: 'not_seen' }]
    const third = renderHook(() => useDiagnosisFlow(inspections, { data: tree, tap: vi.fn() }))
    act(() => third.result.current.prefill())
    third.unmount()
    const fourth = renderHook(() => useDiagnosisFlow(inspections, { data: tree, tap: vi.fn() }))
    expect(fourth.result.current.currentNodeId).toBe('queenless')
  })

  it('reset clears the stored path', () => {
    const { result, unmount } = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    act(() => result.current.select('b'))
    expect(sessionStorage.getItem(DIAGNOSIS_PATH_KEY)).not.toBeNull()
    act(() => result.current.reset())
    expect(sessionStorage.getItem(DIAGNOSIS_PATH_KEY)).toBeNull()
    unmount()
    const again = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    expect(again.result.current.currentNodeId).toBe('root')
  })

  it('starts fresh from a stored path with an unknown node id', () => {
    sessionStorage.setItem(DIAGNOSIS_PATH_KEY, JSON.stringify({ schemaVersion: 1, path: ['root', 'removed-node'] }))
    const { result } = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    expect(result.current.currentNodeId).toBe('root')
    expect(result.current.isInvalid).toBe(false)
  })

  it('counts the path taken and shows no total when route lengths differ', () => {
    const { result } = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    // root: A is 2 steps, B is 3 or 4 steps, so no honest total yet.
    expect(result.current.stepNumber).toBe(1)
    expect(result.current.totalSteps).toBeNull()
    expect(result.current.totalLabel).toBeNull()

    act(() => result.current.select('a'))
    // 'a' is an outcome: the walk is over at step 2 of 2.
    expect(result.current.stepNumber).toBe(2)
    expect(result.current.totalSteps).toBe(2)
    expect(result.current.isOutcome).toBe(true)
  })

  it('shows a total only when the rest of the path is one length, and lands exactly on it', () => {
    const { result } = renderHook(() => useDiagnosisFlow([], { data: tree, tap: vi.fn() }))
    act(() => result.current.select('b'))
    act(() => result.current.select('c'))
    expect(result.current.totalSteps).toBe(4)
    expect(result.current.stepNumber).toBe(3)
    act(() => result.current.select('a'))
    expect(result.current.isOutcome).toBe(true)
    expect(result.current.stepNumber).toBe(result.current.totalSteps)
  })
})
