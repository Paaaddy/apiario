import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useDiagnosisFlow } from './useDiagnosisFlow'

const tree = {
  root: {
    type: 'question',
    question: { en: 'Root', de: 'Root' },
    options: [{ label: { en: 'A', de: 'A' }, next: 'a' }],
  },
  a: {
    type: 'outcome',
    diagnosis: { en: 'A', de: 'A' },
    actions: [{ en: 'Act', de: 'Act' }],
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
})
