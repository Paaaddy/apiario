import { protectReload } from '../pwa/reloadSafety'

export const STORED_VALUE = Symbol('validated stored value')
// `messageKey` names why unsafe data was refused, when the loader knows.
function storedValue(value, unsafe, messageKey) { return { [STORED_VALUE]: true, value, unsafe, messageKey } }

// Unsafe data stays untouched on disk. Loading is tolerant of chronology, not
// unsafe record structure; Backup adds ownership and retention checks separately.
export function loadStoredValue(key, fallback, accepts, normalize = (value) => value) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return storedValue(fallback, false)
    const parsed = JSON.parse(raw)
    if (!accepts(parsed)) {
      // A read-only projection keeps sound records visible without replacing
      // the original collection. Never persist this filtered projection.
      const seen = new Set()
      const value = Array.isArray(parsed) && Array.isArray(fallback)
        ? parsed.filter((record) => {
            if (!accepts([record]) || seen.has(record.id)) return false
            seen.add(record.id)
            return true
          })
        : fallback
      return storedValue(value, true)
    }
    return storedValue(normalize(parsed), false)
  } catch {
    return storedValue(fallback, true)
  }
}

// A versioned collection: `read` turns the parsed stored value into
// `{ ok: true, value }` or a refusal `{ ok: false, value, messageKey }` whose
// value is a read-only projection. Refused data stays untouched on disk.
export function loadStoredCollection(key, read) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return storedValue([], false)
    const outcome = read(JSON.parse(raw))
    return outcome.ok ? storedValue(outcome.value, false) : storedValue(outcome.value, true, outcome.messageKey)
  } catch {
    return storedValue([], true)
  }
}



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
