import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoice } from './useVoice'
import { VOICE_CONFIG, dispatchVoiceCommand } from '../utils/voiceCommands'

function isPermissionBlocked(error) {
  return error === 'not-allowed' || error === 'service-not-allowed'
}

export function useHandsFreeSession(locale, onNavigate) {
  const [isActive, setIsActive] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const runningRef = useRef(false)
  const [lastCommand, setLastCommand] = useState('')
  const [permissionBlocked, setPermissionBlocked] = useState(false)
  const { speak, stopSpeaking, startListening, stopListening } = useVoice()

  const onNavigateRef = useRef(onNavigate)
  useEffect(() => { onNavigateRef.current = onNavigate }, [onNavigate])

  const stop = useCallback(() => {
    runningRef.current = false
    setIsActive(false)
    setIsStarting(false)
    setFeedback(null)
    setLastCommand('')
    stopSpeaking()
    stopListening()
  }, [stopSpeaking, stopListening])

  const stopRef = useRef(stop)
  useEffect(() => { stopRef.current = stop }, [stop])

  const start = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    const config = VOICE_CONFIG[locale] ?? VOICE_CONFIG.en
    setIsStarting(true)
    setFeedback(null)
    setPermissionBlocked(false)
    startListening(
      (transcript) => {
        setLastCommand(transcript)
        const { action, spokenText } = dispatchVoiceCommand(transcript, locale)
        speak(spokenText, { lang: config.lang })
        if (action === 'stop') {
          stopRef.current()
        } else if (action) {
          onNavigateRef.current?.(action)
        }
      },
      (error) => {
        stopRef.current()
        if (isPermissionBlocked(error)) {
          setPermissionBlocked(true)
        } else {
          setFeedback(error === 'unsupported' ? 'unsupported' : 'error')
        }
      },
      {
        lang: config.lang,
        onStart: () => {
          if (!runningRef.current) return
          setIsStarting(false)
          setIsActive(true)
          speak(config.greeting, { lang: config.lang })
        },
        onEnd: () => {
          if (!runningRef.current) return
          stopRef.current()
          setFeedback('ended')
        },
      }
    )
  }, [locale, speak, startListening])

  const retryPermission = useCallback(() => {
    setPermissionBlocked(false)
    start()
  }, [start])

  const dismissPermission = useCallback(() => {
    setPermissionBlocked(false)
  }, [])

  return {
    isActive,
    isStarting,
    feedback,
    dismissFeedback: () => setFeedback(null),
    lastCommand,
    permissionBlocked,
    start,
    stop,
    retryPermission,
    dismissPermission,
  }
}
