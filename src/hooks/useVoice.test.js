import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoice } from './useVoice'

const mockSpeak = vi.fn()
const mockCancel = vi.fn()
const mockStart = vi.fn()
const mockStop = vi.fn()

beforeEach(() => {
  global.speechSynthesis = { speak: mockSpeak, cancel: mockCancel }
  global.SpeechSynthesisUtterance = vi.fn().mockImplementation(function(text) { this.text = text })
  global.SpeechRecognition = vi.fn().mockImplementation(function() {
    this.continuous = false
    this.lang = ''
    this.start = mockStart
    this.stop = mockStop
    this.onresult = null
    this.onerror = null
  })
  vi.clearAllMocks()
})

afterEach(() => {
  delete global.speechSynthesis
  delete global.SpeechSynthesisUtterance
  delete global.SpeechRecognition
})

describe('useVoice', () => {
  it('isSupported is true when Web Speech API is available', () => {
    const { result } = renderHook(() => useVoice())
    expect(result.current.isSupported).toBe(true)
  })

  it('isSupported is false when speechSynthesis is absent', () => {
    delete global.speechSynthesis
    const { result } = renderHook(() => useVoice())
    expect(result.current.isSupported).toBe(false)
  })

  it('speak calls speechSynthesis.speak', () => {
    const { result } = renderHook(() => useVoice())
    act(() => { result.current.speak('Hello beekeeper') })
    expect(mockSpeak).toHaveBeenCalledTimes(1)
  })

  it('stopSpeaking calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useVoice())
    act(() => { result.current.stopSpeaking() })
    expect(mockCancel).toHaveBeenCalledTimes(1)
  })

  it('startListening calls recognition.start', () => {
    const { result } = renderHook(() => useVoice())
    act(() => { result.current.startListening(() => {}) })
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  it('stopListening calls recognition.stop', () => {
    const { result } = renderHook(() => useVoice())
    act(() => {
      result.current.startListening(() => {})
      result.current.stopListening()
    })
    expect(mockStop).toHaveBeenCalledTimes(1)
  })
})
