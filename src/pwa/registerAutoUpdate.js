import { registerSW } from 'virtual:pwa-register'

export function registerPwaAutoUpdate() {
  if (typeof window === 'undefined') return () => {}

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateServiceWorker(true)
    },
    onOfflineReady() {},
  })

  const intervalId = window.setInterval(() => {
    updateServiceWorker(false)
  }, 60 * 60 * 1000)

  return () => {
    window.clearInterval(intervalId)
  }
}
