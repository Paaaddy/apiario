import { useRef, useCallback, useEffect } from 'react'

export function useVoice() {
  const recognitionRef = useRef(null)
  const isSupported = typeof speechSynthesis !== 'undefined'

  useEffect(() => {
    return () => {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [])

  const speak = useCallback((text) => {
    if (!isSupported) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }, [isSupported])

  const stopSpeaking = useCallback(() => {
    if (isSupported) speechSynthesis.cancel()
  }, [isSupported])

  const startListening = useCallback((onCommand, onError) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.lang = 'en-GB'
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
      onCommand(transcript)
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        if (onError) onError(event.error)
      }
    }
    recognition.start()
    recognitionRef.current = recognition
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  return { speak, stopSpeaking, startListening, stopListening, isSupported }
}
