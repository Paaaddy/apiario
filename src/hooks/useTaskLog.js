import { useMemo, useCallback } from 'react'
import { haptics } from '../utils/haptics'
import { useSliceState } from './useSliceState'
import { SLICES } from '../utils/persistedSlices'
import * as colonyData from '../utils/colonyData'

const isoDate = () => new Date().toISOString().split('T')[0]

export function useTaskLog() {
  const { state: log, updateState: setLog, persistenceError, retrySave } =
    useSliceState(SLICES.log)

  const completedTaskIds = useMemo(() => colonyData.completedTaskIds(log), [log])

  const toggleTask = useCallback((task) => {
    // useStoredState runs this transaction synchronously in the event, not
    // as a React updater: haptics stay inside the user-activation window.
    return setLog((prev) => {
      const result = colonyData.toggleTask(prev, task, {
        entryId: `task-${task.id}-${crypto.randomUUID()}`,
        completedAt: isoDate(),
      })
      // Undo remains silent, including several toggles in the same event.
      if (result.completed) haptics.tap()
      return result.log
    })
  }, [setLog])

  const addCustomEntry = useCallback(({ text, date }) => {
    return setLog((prev) =>
      colonyData.addCustomEntry(prev, { entryId: `custom-${crypto.randomUUID()}`, text, date })
    )
  }, [setLog])

  const deleteEntry = useCallback((id) => {
    return setLog((prev) => colonyData.deleteLogEntry(prev, id))
  }, [setLog])

  const sortedLog = useMemo(() => colonyData.sortLogNewestFirst(log), [log])

  return { log: sortedLog, completedTaskIds, toggleTask, addCustomEntry, deleteEntry, persistenceError, retrySave }
}
