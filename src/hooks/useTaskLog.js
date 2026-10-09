import { useMemo, useCallback } from 'react'
import { haptics } from '../utils/haptics'
import { MAX_TASK_LOG_ENTRIES as MAX_ENTRIES } from '../utils/retentionLimits'
import { useStoredState } from './useStoredState'
import { isLogEntry, uniqueRecords, loadStoredValue } from '../utils/recordValidation'

const STORAGE_KEY = 'apiario-log'

function loadLog() {
  return loadStoredValue(STORAGE_KEY, [], (value) => uniqueRecords(value, (entry) => isLogEntry(entry, true)), cap)
}

function cap(log) {
  return log.length > MAX_ENTRIES ? log.slice(0, MAX_ENTRIES) : log
}

export function useTaskLog() {
  const { state: log, updateState: setLog, persistenceError, retrySave } =
    useStoredState(STORAGE_KEY, loadLog)

  const completedTaskIds = useMemo(
    () => new Set(log.filter((e) => e.type === 'task').map((e) => e.taskId)),
    [log]
  )

  const toggleTask = useCallback((task) => {
    // useStoredState runs this transaction synchronously in the event, not
    // as a React updater: haptics stay inside the user-activation window.
    setLog((prev) => {
      const exists = prev.find((e) => e.type === 'task' && e.taskId === task.id)
      // Undo remains silent, including several toggles in the same event.
      if (!exists) haptics.tap()
      const next = exists
        ? prev.filter((e) => !(e.type === 'task' && e.taskId === task.id))
        : cap([
            {
              id: `task-${task.id}-${Date.now()}`,
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
    setLog((prev) => {
      const next = cap([
        {
          id: `custom-${Date.now()}`,
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
    setLog((prev) => {
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
