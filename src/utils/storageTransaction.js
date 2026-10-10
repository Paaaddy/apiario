import { protectReload } from '../pwa/reloadSafety'

// Shared by Backup replacement and related ordinary changes. Exact raw strings
// survive rollback; this session-only recovery is not a crash-safe transaction.
let recovery = null
const listeners = new Set()
const recoveryToken = {}

export function hasStorageRecovery() { return recovery !== null }
export function getRecoveryCause() { return recovery?.cause ?? null }
export function subscribeStorageRecovery(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setRecovery(value) {
  recovery = value
  protectReload(recoveryToken, value !== null)
  listeners.forEach((listener) => listener())
}

function restoreSnapshot(snapshot) {
  let failed = false
  for (const [key, previous] of snapshot) {
    try {
      if (previous === null) localStorage.removeItem(key)
      else localStorage.setItem(key, previous)
    } catch {
      failed = true
    }
  }
  return !failed
}

export function writeStorageTransaction(entries, cause = 'mutation') {
  if (hasStorageRecovery()) return { ok: false, error: 'recovery' }
  let snapshot, prepared
  try {
    snapshot = entries.map(([key]) => [key, localStorage.getItem(key)])
    prepared = entries.map(([, value]) => JSON.stringify(value))
  } catch {
    return { ok: false, error: 'storage' }
  }
  const written = []
  try {
    entries.forEach(([key], index) => {
      localStorage.setItem(key, prepared[index])
      written.push(snapshot[index])
    })
  } catch {
    written.reverse()
    if (!restoreSnapshot(written)) {
      setRecovery({ snapshot: written, cause })
      return { ok: false, error: 'recovery' }
    }
    return { ok: false, error: 'storage' }
  }
  return { ok: true }
}

export function recoverStorageTransaction() {
  if (!recovery) return { ok: false, error: 'storage' }
  if (!restoreSnapshot(recovery.snapshot)) return { ok: false, error: 'recovery' }
  setRecovery(null)
  return { ok: true }
}
