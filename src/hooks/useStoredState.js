import { useState, useRef, useCallback } from 'react'
import { hasBackupRecovery } from '../utils/dataBackup'

const STORAGE_ERROR = {
  ok: false,
  error: 'storage',
  messageKey: 'storage_error',
  requiresReload: false,
}

// Loaders own validation/migration. Mutations and retries run in event handlers,
// never in replayable React updaters or mount effects.
export function useStoredState(storageKey, load) {
  const [state, setState] = useState(load)
  const [persistenceError, setPersistenceError] = useState(null)
  const stateRef = useRef(state)

  const save = useCallback((value) => {
    // A recovery snapshot must not overwrite newer durable observations. Keep
    // edits as unsaved drafts until recovery completes, then allow a retry.
    if (hasBackupRecovery()) {
      setPersistenceError(STORAGE_ERROR)
      return STORAGE_ERROR
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
      setPersistenceError(null)
      return { ok: true }
    } catch {
      setPersistenceError(STORAGE_ERROR)
      return STORAGE_ERROR
    }
  }, [storageKey])

  const updateState = useCallback((update) => {
    const next = update(stateRef.current)
    // Advance synchronously so several mutations in one event see each other,
    // including when storage is unavailable. Failed changes remain in memory.
    stateRef.current = next
    setState(next)
    return save(next)
  }, [save])

  const retrySave = useCallback(() => save(stateRef.current), [save])

  return { state, updateState, persistenceError, retrySave }
}
