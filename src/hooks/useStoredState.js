import { useState, useRef, useCallback, useEffect } from 'react'
import { hasStorageRecovery, writeStorageTransaction, STORED_VALUE } from '../utils/storageEngine'
import { protectReload } from '../pwa/reloadSafety'

const STORAGE_ERROR = {
  ok: false,
  error: 'storage',
  messageKey: 'storage_error',
  requiresReload: false,
}

const INVALID_SOURCE = { ...STORAGE_ERROR, messageKey: 'storage_invalid' }
const INVALID_CHANGE = { ok: false, error: 'validation', messageKey: 'record_invalid', requiresReload: false }
const acceptsAny = () => true
const storeAsIs = (value) => value
let activeTransaction = null

// Internal seam: stage related hook changes without exposing storage mechanics
// to callers. Publish React state only after every durable write succeeds.
export function runStoredTransaction(change) {
  if (activeTransaction) throw new Error('Nested stored transactions are not supported')
  const transaction = { entries: new Map(), error: null }
  activeTransaction = transaction
  try {
    change()
  } finally {
    activeTransaction = null
  }
  if (transaction.error) return transaction.error
  const entries = [...transaction.entries.values()]
  const outcome = writeStorageTransaction(entries.map((entry) => [entry.key, entry.encode(entry.value)]))
  if (outcome.ok) entries.forEach((entry) => entry.commit(entry.value))
  return outcome
}

// Loaders own validation/migration. Mutations and retries run in event handlers,
// never in replayable React updaters or mount effects. `encode` turns the
// in-memory value into its stored form on every write.
export function useStoredState(storageKey, load, accepts = acceptsAny, encode = storeAsIs) {
  const [loaded] = useState(() => {
    const value = load()
    const result = value?.[STORED_VALUE] ? value : { value, unsafe: false }
    const sourceError = result.unsafe
      ? { ...INVALID_SOURCE, messageKey: result.messageKey ?? INVALID_SOURCE.messageKey }
      : null
    return { ...result, sourceError }
  })
  const [state, setState] = useState(loaded.value)
  const [persistenceError, setPersistenceError] = useState(loaded.sourceError)
  const stateRef = useRef(state)
  const token = useRef({})
  useEffect(() => {
    const owner = token.current
    protectReload(owner, loaded.unsafe)
    return () => protectReload(owner, false)
  }, [loaded.unsafe])

  const report = useCallback((error) => {
    protectReload(token.current, error !== null)
    setPersistenceError(error)
  }, [])

  const save = useCallback((value) => {
    // A recovery snapshot must not overwrite newer durable observations. Keep
    // edits as unsaved drafts until recovery completes, then allow a retry.
    if (loaded.unsafe) {
      report(loaded.sourceError)
      return loaded.sourceError
    }
    if (hasStorageRecovery()) {
      report(STORAGE_ERROR)
      return STORAGE_ERROR
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(encode(value)))
      report(null)
      return { ok: true }
    } catch {
      report(STORAGE_ERROR)
      return STORAGE_ERROR
    }
  }, [storageKey, loaded.unsafe, loaded.sourceError, report, encode])

  const commit = useCallback((value) => {
    stateRef.current = value
    setState(value)
    report(null)
  }, [report])

  const updateState = useCallback((update) => {
    const previous = activeTransaction?.entries.get(token.current)?.value ?? stateRef.current
    const next = update(previous)
    // Ordinary writes use the same structural rules as loading and Backup;
    // rejected changes never enter session state or durable storage.
    if (!accepts(next)) {
      if (activeTransaction) activeTransaction.error = INVALID_CHANGE
      return INVALID_CHANGE
    }
    if (activeTransaction) {
      if (loaded.unsafe) activeTransaction.error = loaded.sourceError
      activeTransaction.entries.set(token.current, { key: storageKey, value: next, encode, commit })
      return { ok: true }
    }
    // Advance synchronously so several mutations in one event see each other,
    // including when storage is unavailable. Failed changes remain in memory.
    stateRef.current = next
    setState(next)
    return save(next)
  }, [save, storageKey, loaded.unsafe, loaded.sourceError, commit, accepts, encode])

  const getState = useCallback(() => stateRef.current, [])

  const retrySave = useCallback(() => save(stateRef.current), [save])

  return { state, updateState, persistenceError, retrySave, getState }
}
