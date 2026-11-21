import { useCallback, useEffect, useRef, useState } from 'react'
import { runStoredTransaction } from './useStoredState'

export const UNDO_WINDOW_MS = 10000

// Backup export and restore read storage directly, so they commit an open
// deletion first: an export must not contain a Colony the screen already
// dropped, and a restore must not be followed by a late deletion of a
// restored Colony with the same id. Set by the mounted hook.
let flushOpenRemoval = null
export function flushPendingColonyRemoval() {
  flushOpenRemoval?.()
}

/**
 * Deleting a Colony hides it at once and opens an undo window. Nothing is
 * written until the window ends, so Undo has nothing to restore: the Colony
 * and every one of its Inspections were never touched. Only one deletion is
 * open at a time; a second one commits the first. A reload or leaving the page
 * (`pagehide`) commits the open deletion; surviving a reload mid-window is out
 * of scope (#193). A commit that fails to store restores the visible Colony
 * and offers a retry, like any failed deletion.
 */
export function useColonyRemoval(removeColony, removeInspections, { colonies = [], windowMs = UNDO_WINDOW_MS } = {}) {
  const [pending, setPending] = useState(null)
  const [failedColonyId, setFailedColonyId] = useState(null)
  const pendingRef = useRef(null)
  const latest = useRef({})
  useEffect(() => {
    latest.current = { removeColony, removeInspections, colonies }
  })

  const commitRemoval = useCallback((colonyId) => {
    const { removeColony: dropColony, removeInspections: dropInspections } = latest.current
    const outcome = runStoredTransaction(() => {
      dropInspections(colonyId)
      dropColony(colonyId)
    })
    setFailedColonyId(outcome.ok ? null : colonyId)
    return outcome
  }, [])

  const commitPending = useCallback(() => {
    const open = pendingRef.current
    if (!open) return null
    pendingRef.current = null
    setPending(null)
    return commitRemoval(open.colonyId)
  }, [commitRemoval])

  const remove = useCallback((colonyId) => {
    commitPending()
    const colony = latest.current.colonies.find((candidate) => candidate.id === colonyId)
    pendingRef.current = { colonyId, name: colony?.name ?? '' }
    setPending(pendingRef.current)
    return { ok: true }
  }, [commitPending])

  const undo = useCallback(() => {
    pendingRef.current = null
    setPending(null)
  }, [])

  useEffect(() => {
    if (!pending) return undefined
    const timer = setTimeout(commitPending, windowMs)
    return () => clearTimeout(timer)
  }, [pending, windowMs, commitPending])

  useEffect(() => {
    flushOpenRemoval = commitPending
    window.addEventListener('pagehide', commitPending)
    return () => {
      window.removeEventListener('pagehide', commitPending)
      if (flushOpenRemoval === commitPending) flushOpenRemoval = null
    }
  }, [commitPending])

  return {
    remove,
    undo,
    // The open deletion: its Colony is hidden and Undo is on offer.
    undoable: pending,
    // A committed deletion that failed to store: the Colony is visible again.
    pendingColonyId: failedColonyId,
    retry: () => commitRemoval(failedColonyId),
  }
}
