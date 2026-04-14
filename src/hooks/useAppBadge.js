import { useEffect } from 'react'

/**
 * Sets the app icon badge to `count`. When the count is 0 (or falsy),
 * clears the badge. Automatically clears on unmount.
 *
 * The App Badging API is Chromium-only today (Chrome / Edge on
 * desktop and Android) and requires the PWA to be installed — when
 * unsupported, this hook silently no-ops.
 *
 * For Apiario the badge reflects how many season tasks in the current
 * week are still outstanding, so the installed app tile on the home
 * screen acts as a passive reminder.
 */
export function useAppBadge(count) {
  useEffect(() => {
    if (typeof navigator === 'undefined') return undefined
    if (typeof navigator.setAppBadge !== 'function') return undefined

    const safeCount = Math.max(0, Math.floor(Number(count) || 0))

    const apply = async () => {
      try {
        if (safeCount > 0) {
          await navigator.setAppBadge(safeCount)
        } else {
          await navigator.clearAppBadge?.()
        }
      } catch {
        // Silently ignore — some platforms throw NotAllowedError
        // when the PWA is not yet installed.
      }
    }

    apply()

    return () => {
      if (typeof navigator.clearAppBadge === 'function') {
        navigator.clearAppBadge().catch(() => {})
      }
    }
  }, [count])
}
