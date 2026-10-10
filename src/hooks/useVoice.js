import { useRef, useCallback, useEffect } from 'react'

/**
 * Thin wrapper around `speechSynthesis` + `SpeechRecognition`.
 *
 * Both synthesis and recognition now honour a `lang` argument
 * (`'de-DE'` or `'en-GB'`) so the hands-free experience actually
 * speaks the user's language and recognises locale-native commands.
 * Previously everything was hardcoded to `en-GB`, which made hands-
 * free mode basically useless for a German-speaking beekeeper.
 */
export function useVoice() {
  const recognitionRef = useRef(null)
  const isSupported = typeof speechSynthesis !== 'undefined'

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (!recognition) return
    recognition.onstart = recognition.onend = recognition.onerror = recognition.onresult = null
    try { recognition.stop() } catch { /* Already stopped by the browser. */ }
  }, [])

  useEffect(() => {
    return () => {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
      stopListening()
    }
  }, [stopListening])

  const speak = useCallback((text, opts = {}) => {
    if (!isSupported) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = opts.lang ?? 'en-GB'
    utterance.rate = opts.rate ?? 0.95
    speechSynthesis.speak(utterance)
  }, [isSupported])

  const stopSpeaking = useCallback(() => {
    if (isSupported) speechSynthesis.cancel()
  }, [isSupported])

  const startListening = useCallback((onCommand, onError, opts = {}) => {
    stopListening()
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      onError?.('unsupported')
      return
    }
    try {
      const recognition = new Recognition()
      recognitionRef.current = recognition
      const isCurrent = () => recognitionRef.current === recognition
      recognition.continuous = true
      recognition.lang = opts.lang ?? 'en-GB'
      recognition.onstart = () => { if (isCurrent()) opts.onStart?.() }
      recognition.onend = () => {
        if (!isCurrent()) return
        recognitionRef.current = null
        opts.onEnd?.()
      }
      recognition.onresult = (event) => {
        if (!isCurrent()) return
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
        onCommand(transcript)
      }
      recognition.onerror = (event) => {
        if (!isCurrent()) return
        stopListening()
        onError?.(event.error)
      }
      recognition.start()
    } catch {
      stopListening()
      onError?.('start-failed')
    }
  }, [stopListening])

  return { speak, stopSpeaking, startListening, stopListening, isSupported }
}
