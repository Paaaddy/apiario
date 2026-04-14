import { useCallback, useEffect, useMemo, useState } from 'react'

function getStandaloneMatch() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(display-mode: standalone)').matches
}

function getIosStandalone() {
  if (typeof window === 'undefined') return false
  return Boolean(window.navigator.standalone)
}

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() => getStandaloneMatch() || getIosStandalone())

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = () => {
      if (media.matches || getIosStandalone()) {
        setIsInstalled(true)
        setDeferredPrompt(null)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    media.addEventListener?.('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      media.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [])

  const installSupported = useMemo(() => Boolean(deferredPrompt), [deferredPrompt])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)

    return choice.outcome === 'accepted'
  }, [deferredPrompt])

  return {
    isInstalled,
    installSupported,
    promptInstall,
  }
}
