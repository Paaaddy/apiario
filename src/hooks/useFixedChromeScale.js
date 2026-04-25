import { useEffect } from 'react'

/**
 * Keeps `--app-zoom` and `--vv-*` CSS custom properties on :root in
 * sync with the user's current zoom factor and visual viewport.
 *
 * Three zoom paths feed in:
 *   1. Pinch zoom (mobile)            → `visualViewport.scale`
 *   2. Browser page zoom (desktop)    → `outerWidth / innerWidth`
 *   3. OS display scaling / a11y zoom → also reflected in (2)
 *
 * Elements that opt into the `.fixed-chrome` utility apply a
 * `transform: scale(1 / var(--app-zoom))` so they stay at a stable
 * on-screen size while the rest of the page is free to grow.
 *
 * Pure side effect — no return value. Mount once near the root.
 */
export function useFixedChromeScale() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const root = document.documentElement
    const vv = window.visualViewport ?? null

    const round = (n) => Math.round(n * 1000) / 1000

    const update = () => {
      const pinch = vv?.scale ?? 1
      const browser =
        window.outerWidth && window.innerWidth
          ? window.outerWidth / window.innerWidth
          : 1
      const total = round(pinch * browser) || 1

      root.style.setProperty('--app-zoom', String(total))

      if (vv) {
        root.style.setProperty('--vv-offset-top', `${round(vv.offsetTop)}px`)
        root.style.setProperty('--vv-offset-left', `${round(vv.offsetLeft)}px`)
        root.style.setProperty('--vv-width', `${round(vv.width)}px`)
        root.style.setProperty('--vv-height', `${round(vv.height)}px`)
      }
    }

    update()

    if (vv) {
      vv.addEventListener('resize', update)
      vv.addEventListener('scroll', update)
    }
    window.addEventListener('resize', update)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update)
        vv.removeEventListener('scroll', update)
      }
      window.removeEventListener('resize', update)
    }
  }, [])
}
