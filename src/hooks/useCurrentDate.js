import { useEffect, useState } from 'react'

// A shared local clock for dated guidance, not a background polling loop.
// Disable the subscription when a parent already supplies the current date.
export function useCurrentDate(enabled = true) {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    if (!enabled) return
    let timer
    function refresh() {
      const now = new Date()
      setToday(now)
      clearTimeout(timer)
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight.getTime() - now.getTime())
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') refresh()
    }
    refresh()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled])

  return today
}
