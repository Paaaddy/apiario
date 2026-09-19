import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import { useHandsFreeSession } from './useHandsFreeSession'
import { VOICE_CONFIG } from '../utils/voiceCommands'

const speak = vi.fn()
const stopSpeaking = vi.fn()
const startListening = vi.fn()
const stopListening = vi.fn()

vi.mock('./useVoice', () => ({
  useVoice: () => ({ speak, stopSpeaking, startListening, stopListening }),
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useHandsFreeSession', () => {
  it('starts in the active locale and begins listening', () => {
    const { result } = renderHook(() => useHandsFreeSession('de', vi.fn()))

    act(() => result.current.start())

    expect(result.current.isActive).toBe(true)
    expect(speak).toHaveBeenCalledWith(VOICE_CONFIG.de.greeting, { lang: 'de-DE' })
    expect(startListening).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { lang: 'de-DE' })
  })

  it('dispatches navigation commands through the caller seam', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() => useHandsFreeSession('en', onNavigate))

    act(() => result.current.start())
    const onTranscript = startListening.mock.calls[0][0]
    act(() => onTranscript('open season'))

    expect(result.current.lastCommand).toBe('open season')
    expect(speak).toHaveBeenLastCalledWith(VOICE_CONFIG.en.speech.openSeason, { lang: 'en-GB' })
    expect(onNavigate).toHaveBeenCalledWith('season')
  })

  it('stops the session when the stop command is heard', () => {
    const { result } = renderHook(() => useHandsFreeSession('en', vi.fn()))

    act(() => result.current.start())
    const onTranscript = startListening.mock.calls[0][0]
    act(() => onTranscript('stop'))

    expect(result.current.isActive).toBe(false)
    expect(result.current.lastCommand).toBe('')
    expect(stopSpeaking).toHaveBeenCalled()
    expect(stopListening).toHaveBeenCalled()
  })

  it('opens permission state when recognition is blocked', () => {
    const { result } = renderHook(() => useHandsFreeSession('en', vi.fn()))

    act(() => result.current.start())
    const onError = startListening.mock.calls[0][1]
    act(() => onError('not-allowed'))

    expect(result.current.isActive).toBe(false)
    expect(result.current.permissionBlocked).toBe(true)
  })

  it('retries permission after dismissing the modal state', () => {
    const { result } = renderHook(() => useHandsFreeSession('en', vi.fn()))

    act(() => result.current.start())
    act(() => startListening.mock.calls[0][1]('service-not-allowed'))
    act(() => result.current.retryPermission())
    expect(result.current.permissionBlocked).toBe(false)

    act(() => vi.runOnlyPendingTimers())
    expect(startListening).toHaveBeenCalledTimes(2)
  })
})
