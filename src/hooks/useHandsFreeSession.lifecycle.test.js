import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useHandsFreeSession } from './useHandsFreeSession'

let recognition
beforeEach(() => {
  vi.stubGlobal('SpeechRecognition', vi.fn(function () {
    recognition = this
    this.start = vi.fn()
    this.stop = vi.fn()
  }))
})
afterEach(() => vi.unstubAllGlobals())

it.each(['unsupported', 'network', 'start-failed', 'not-allowed'])('connects %s recognition failure to accurate session feedback', (failure) => {
  if (failure === 'unsupported') delete global.SpeechRecognition
  if (failure === 'start-failed') global.SpeechRecognition.mockImplementationOnce(function () {
    recognition = this
    this.start = () => { throw new Error('Start failed') }
    this.stop = vi.fn()
  })
  const { result } = renderHook(() => useHandsFreeSession('en', vi.fn()))
  act(() => result.current.start())
  if (failure === 'network' || failure === 'not-allowed') act(() => recognition.onerror({ error: failure }))
  expect(result.current.isActive).toBe(false)
  expect(result.current.isStarting).toBe(false)
  expect(result.current.permissionBlocked).toBe(failure === 'not-allowed')
  expect(result.current.feedback).toBe(failure === 'not-allowed' ? null : failure === 'unsupported' ? 'unsupported' : 'error')
  act(() => result.current.dismissFeedback())
  expect(result.current.feedback).toBeNull()
})

it('waits for actual recognition, stops on natural end, and only restarts explicitly', () => {
  const { result } = renderHook(() => useHandsFreeSession('en', vi.fn()))
  act(() => result.current.start())
  expect(result.current.isActive).toBe(false)
  expect(result.current.isStarting).toBe(true)
  act(() => recognition.onstart())
  expect(result.current.isActive).toBe(true)
  act(() => recognition.onend())
  expect(result.current.isActive).toBe(false)
  expect(result.current.feedback).toBe('ended')
  expect(global.SpeechRecognition).toHaveBeenCalledOnce()
  act(() => result.current.start())
  expect(global.SpeechRecognition).toHaveBeenCalledTimes(2)
  expect(result.current.feedback).toBeNull()
})

it('intentional stop stays quiet and late results cannot navigate', () => {
  const navigate = vi.fn()
  const { result } = renderHook(() => useHandsFreeSession('en', navigate))
  act(() => result.current.start())
  const oldResult = recognition.onresult
  act(() => result.current.stop())
  act(() => oldResult({ results: [[{ transcript: 'season' }]] }))
  expect(navigate).not.toHaveBeenCalled()
  expect(result.current.feedback).toBeNull()
})
