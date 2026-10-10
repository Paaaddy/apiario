// Synchronous protection: browser callbacks can run before React paints a notice.
const blockers = new Set()
const listeners = new Set()
let pendingReload = null
let status = { pending: false, blocked: false }

function publish() {
  const next = { pending: pendingReload !== null, blocked: blockers.size > 0 }
  if (next.pending === status.pending && next.blocked === status.blocked) return
  status = next
  listeners.forEach((listener) => listener())
}

export function protectReload(token, blocked) {
  if (blocked) blockers.add(token)
  else blockers.delete(token)
  publish()
}

export function requestAppReload(reload) {
  if (blockers.size === 0 && pendingReload === null) {
    reload()
    return
  }
  pendingReload = reload
  publish()
}

export function applyPendingUpdate() {
  if (blockers.size > 0 || pendingReload === null) return false
  const reload = pendingReload
  pendingReload = null
  publish()
  reload()
  return true
}

export function cancelPendingReload(reload) {
  if (pendingReload === reload) {
    pendingReload = null
    publish()
  }
}

export function getReloadStatus() { return status }
export function subscribeReloadStatus(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
