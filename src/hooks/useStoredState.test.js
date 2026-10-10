import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useStoredState } from './useStoredState'

afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

it('preserves the original caller interface for a plain state loader', () => {
  const { result } = renderHook(() => useStoredState('plain-state', () => ['first']))
  expect(result.current.state).toEqual(['first'])
  act(() => result.current.updateState((previous) => [...previous, 'second']))
  expect(result.current.state).toEqual(['first', 'second'])
  expect(JSON.parse(localStorage.getItem('plain-state'))).toEqual(['first', 'second'])
})

it('does not mistake caller state fields for internal loading metadata', () => {
  const value = { value: 'observation', unsafe: 'a caller-owned field' }
  const { result } = renderHook(() => useStoredState('plain-state', () => value))
  expect(result.current.state).toEqual(value)
  expect(result.current.persistenceError).toBeNull()
})
