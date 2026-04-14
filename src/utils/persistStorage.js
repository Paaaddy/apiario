/**
 * Asks the browser to make the origin's storage persistent, meaning
 * IndexedDB, localStorage and Cache Storage are no longer eligible for
 * eviction under storage pressure.
 *
 * Apiario is a no-backend offline-first PWA — the log, profile and
 * colonies all live in localStorage. If the browser evicts that data
 * (Chrome does this under storage pressure when the origin has no
 * persistent grant), the user silently loses everything. This
 * promotes the origin to "persistent" once the user has enough data
 * worth protecting, which in practice is "after onboarding is done".
 *
 * The browser decides whether to grant. In Chromium, installed PWAs
 * with bookmark/history/push permissions are usually granted; fresh
 * tabs are not. When not granted the hook silently reports `false`.
 *
 * Returns `{ supported, persisted, estimate }`:
 *   - `supported`: `navigator.storage.persist` exists
 *   - `persisted`: the origin's storage is persistent right now
 *   - `estimate`: the result of `navigator.storage.estimate()` if
 *                 available, for diagnostics in the debug panel
 */
export async function requestPersistentStorage() {
  if (
    typeof navigator === 'undefined' ||
    !navigator.storage ||
    typeof navigator.storage.persist !== 'function'
  ) {
    return { supported: false, persisted: false, estimate: null }
  }

  let persisted = false
  try {
    persisted =
      typeof navigator.storage.persisted === 'function'
        ? await navigator.storage.persisted()
        : false
    if (!persisted) {
      persisted = await navigator.storage.persist()
    }
  } catch {
    persisted = false
  }

  let estimate = null
  try {
    if (typeof navigator.storage.estimate === 'function') {
      estimate = await navigator.storage.estimate()
    }
  } catch {
    // Some browsers (older Safari) throw on estimate — ignore.
  }

  return { supported: true, persisted, estimate }
}
