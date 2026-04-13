import { useRef, useCallback } from 'react'

export function useVoice() {
  const recognitionRef = useRef(null)
  const isSupported = typeof speechSynthesis !== 'undefined'

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

  const startListening = useCallback((onCommand) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.lang = 'en-GB'
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
      onCommand(transcript)
    }
    recognition.onerror = () => {}
    recognition.start()
    recognitionRef.current = recognition
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  return { speak, stopSpeaking, startListening, stopListening, isSupported }
}
