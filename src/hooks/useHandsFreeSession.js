import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoice } from './useVoice'
import { VOICE_CONFIG, dispatchVoiceCommand } from '../utils/voiceCommands'

function isPermissionBlocked(error) {
  return error === 'not-allowed' || error === 'service-not-allowed'
}

export function useHandsFreeSession(locale, onNavigate) {
  const [isActive, setIsActive] = useState(false)
  const [lastCommand, setLastCommand] = useState('')
  const [permissionBlocked, setPermissionBlocked] = useState(false)
  const { speak, stopSpeaking, startListening, stopListening } = useVoice()

  const onNavigateRef = useRef(onNavigate)
  useEffect(() => { onNavigateRef.current = onNavigate }, [onNavigate])

  const stop = useCallback(() => {
    setIsActive(false)
    setLastCommand('')
    stopSpeaking()
    stopListening()
  }, [stopSpeaking, stopListening])

  const stopRef = useRef(stop)
  useEffect(() => { stopRef.current = stop }, [stop])

  const start = useCallback(() => {
    if (isActive) return
    const config = VOICE_CONFIG[locale] ?? VOICE_CONFIG.en
    setIsActive(true)
    speak(config.greeting, { lang: config.lang })
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
        }
      },
      { lang: config.lang }
    )
  }, [isActive, locale, speak, startListening])

  const retryPermission = useCallback(() => {
    setPermissionBlocked(false)
    setTimeout(() => start(), 0)
  }, [start])

  const dismissPermission = useCallback(() => {
    setPermissionBlocked(false)
  }, [])

  return {
    isActive,
    lastCommand,
    permissionBlocked,
    start,
    stop,
    retryPermission,
    dismissPermission,
  }
}
