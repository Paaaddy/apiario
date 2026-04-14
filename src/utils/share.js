/**
 * Thin wrapper around `navigator.share` with a graceful clipboard
 * fallback. Returns a result object so call sites can decide how to
 * react (e.g. show a "Copied!" toast when the OS share sheet wasn't
 * available).
 *
 * Result shape:
 *   { status: 'shared' }                 // native share sheet succeeded
 *   { status: 'cancelled' }              // user dismissed the share sheet
 *   { status: 'copied' }                 // fell back to clipboard
 *   { status: 'unsupported', error }     // neither API worked
 */
export async function shareOrCopy({ title, text, url }) {
  const payload = { title, text, url }
  Object.keys(payload).forEach((k) => {
    if (payload[k] == null) delete payload[k]
  })

  // 1. Native Web Share API (Android Chrome, iOS Safari, recent desktops)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload)
      return { status: 'shared' }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return { status: 'cancelled' }
      }
      // Fall through to clipboard fallback on other errors.
    }
  }

  // 2. Async Clipboard API fallback — assemble a single readable blob.
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    const parts = []
    if (title) parts.push(title)
    if (text) parts.push(text)
    if (url) parts.push(url)
    try {
      await navigator.clipboard.writeText(parts.join('\n\n'))
      return { status: 'copied' }
    } catch (err) {
      return { status: 'unsupported', error: err }
    }
  }

  return { status: 'unsupported' }
}

export const isWebShareSupported =
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'
