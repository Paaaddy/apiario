import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Holds a screen wake lock while `enabled` is true. Releases it on
 * unmount or when `enabled` flips to false. Re-acquires automatically
 * when the document becomes visible again (browsers drop wake locks
 * when the tab goes to the background).
 *
 * Gracefully no-ops on browsers without Screen Wake Lock support.
 * Exposes `isSupported`, `isActive`, and the current `error` if any.
 *
 * Typical usage: keep the screen awake while the beekeeper is reading
 * the diagnose wizard outdoors with the phone in their hand.
 */
export function useWakeLock(enabled) {
  const sentinelRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)

  const isSupported =
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    typeof navigator.wakeLock?.request === 'function'

  const acquire = useCallback(async () => {
    if (!isSupported) return
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      sentinelRef.current = sentinel
      setIsActive(true)
      setError(null)
      sentinel.addEventListener('release', () => {
        // Browser may release the lock on its own (e.g. tab hidden).
        setIsActive(false)
      })
    } catch (err) {
      setError(err)
      setIsActive(false)
    }
  }, [isSupported])

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current
    sentinelRef.current = null
    setIsActive(false)
    if (sentinel) {
      try { await sentinel.release() } catch { /* already released */ }
    }
  }, [])

  useEffect(() => {
    if (!enabled || !isSupported) return
    acquire()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      release()
    }
  }, [enabled, isSupported, acquire, release])

  return { isSupported, isActive, error }
}
