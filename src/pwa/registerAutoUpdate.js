import { registerSW } from 'virtual:pwa-register'
import { cancelPendingReload, requestAppReload } from './reloadSafety'

export function registerPwaAutoUpdate(reload = () => window.location.reload()) {
  if (typeof window === 'undefined') return () => {}

  let registration = null
  let disposed = false
  registerSW({
    immediate: true,
    onNeedReload() {
      if (!disposed) requestAppReload(reload)
    },
    onRegisteredSW(_url, value) { registration = value },
    onOfflineReady() {},
  })

  const intervalId = window.setInterval(() => {
    if (registration) registration.update().catch(() => {})
  }, 60 * 60 * 1000)

  return () => {
    disposed = true
    cancelPendingReload(reload)
    window.clearInterval(intervalId)
  }
}
