import { useState, useCallback } from 'react'
import { loadStoredValue } from '../utils/storageEngine'

export const PWA_HINT_DISMISSED_KEY = 'apiario-pwa-hint-dismissed'

const isDismissedFlag = (value) => value === true

// Cosmetic preference, like theme and locale: it loads through the shared
// tolerant loader and writes best-effort. A failed write must not raise a
// persistence error, because that would block app updates over a hint.
export function usePwaHintDismissal() {
  const [dismissed, setDismissed] = useState(
    () => loadStoredValue(PWA_HINT_DISMISSED_KEY, false, isDismissedFlag).value === true
  )

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(PWA_HINT_DISMISSED_KEY, 'true')
    } catch {
      // Storage unavailable: the hint stays dismissed for this session only.
    }
  }, [])

  return { dismissed, dismiss }
}
