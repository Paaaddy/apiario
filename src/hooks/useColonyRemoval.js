import { useCallback, useState } from 'react'
import { runStoredTransaction } from './useStoredState'

export function useColonyRemoval(removeColony, removeInspections) {
  const [pendingColonyId, setPendingColonyId] = useState(null)
  const remove = useCallback((colonyId) => {
    const outcome = runStoredTransaction(() => {
      removeInspections(colonyId)
      removeColony(colonyId)
    })
    setPendingColonyId(outcome.ok ? null : colonyId)
    return outcome
  }, [removeColony, removeInspections])
  return { remove, pendingColonyId, retry: () => remove(pendingColonyId) }
}
