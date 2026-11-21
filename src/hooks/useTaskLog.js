import { useMemo, useCallback } from 'react'
import { haptics } from '../utils/haptics'
import { useSliceState } from './useSliceState'
import { LOG_SCHEMA_VERSION, SLICES, capLog } from '../utils/persistedSlices'

export function useTaskLog() {
  const { state: log, updateState: setLog, persistenceError, retrySave } =
    useSliceState(SLICES.log)

  const completedTaskIds = useMemo(
    () => new Set(log.filter((e) => e.type === 'task').map((e) => e.taskId)),
    [log]
  )

  const toggleTask = useCallback((task) => {
    // useStoredState runs this transaction synchronously in the event, not
    // as a React updater: haptics stay inside the user-activation window.
    return setLog((prev) => {
      const exists = prev.find((e) => e.type === 'task' && e.taskId === task.id)
      // Undo remains silent, including several toggles in the same event.
      if (!exists) haptics.tap()
      const next = exists
        ? prev.filter((e) => !(e.type === 'task' && e.taskId === task.id))
        : capLog([
            {
              id: `task-${task.id}-${crypto.randomUUID()}`,
              schemaVersion: LOG_SCHEMA_VERSION,
              type: 'task',
              taskId: task.id,
              taskName: task.name,
              completedAt: new Date().toISOString().split('T')[0],
            },
            ...prev,
          ])
      return next
    })
  }, [setLog])

  const addCustomEntry = useCallback(({ text, date }) => {
    return setLog((prev) => {
      const next = capLog([
        {
          id: `custom-${crypto.randomUUID()}`,
          schemaVersion: LOG_SCHEMA_VERSION,
          type: 'custom',
          text,
          date,
        },
        ...prev,
      ])
      return next
    })
  }, [setLog])

  const deleteEntry = useCallback((id) => {
    return setLog((prev) => {
      const next = prev.filter((e) => e.id !== id)
      return next
    })
  }, [setLog])

  const sortedLog = useMemo(
    () =>
      [...log].sort((a, b) => {
        const dateA = a.completedAt || a.date || ''
        const dateB = b.completedAt || b.date || ''
        return dateB.localeCompare(dateA)
      }),
    [log]
  )

  return { log: sortedLog, completedTaskIds, toggleTask, addCustomEntry, deleteEntry, persistenceError, retrySave }
}
