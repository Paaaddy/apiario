import { useState, useMemo, useCallback, useRef } from 'react'
import { haptics } from '../utils/haptics'

const STORAGE_KEY = 'apiario-log'
const MAX_ENTRIES = 500

function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLog(log) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
  } catch {}
}

function cap(log) {
  return log.length > MAX_ENTRIES ? log.slice(0, MAX_ENTRIES) : log
}

export function useTaskLog() {
  const [log, setLog] = useState(loadLog)

  // Mirror `log` into a ref so the event-handler path below can read
  // the latest log synchronously without having to re-bind the
  // callback on every log change. This is what lets us decide
  // "is this a check or an uncheck?" *before* we fire the haptic.
  const logRef = useRef(log)
  logRef.current = log

  const completedTaskIds = useMemo(
    () => new Set(log.filter((e) => e.type === 'task').map((e) => e.taskId)),
    [log]
  )

  const toggleTask = useCallback((task) => {
    // IMPORTANT: fire the haptic SYNCHRONOUSLY from the outer callback,
    // not from inside the `setLog` state updater. React schedules the
    // updater to run during the commit phase, which can happen outside
    // the user-activation window that Chrome / Android require for
    // `navigator.vibrate()` to actually trigger the motor. Calling
    // haptics.tap() here keeps us inside the click handler's gesture.
    const alreadyChecked = (logRef.current ?? []).some(
      (e) => e.type === 'task' && e.taskId === task.id
    )
    // Only buzz on check — undoing a mistake stays silent so it feels
    // reversible rather than rewarded.
    if (!alreadyChecked) haptics.tap()

    setLog((prev) => {
      const exists = prev.find((e) => e.type === 'task' && e.taskId === task.id)
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
      saveLog(next)
      return next
    })
  }, [])

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
      saveLog(next)
      return next
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setLog((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveLog(next)
      return next
    })
  }, [])

  const sortedLog = useMemo(
    () =>
      [...log].sort((a, b) => {
        const dateA = a.completedAt || a.date || ''
        const dateB = b.completedAt || b.date || ''
        return dateB.localeCompare(dateA)
      }),
    [log]
  )

  return { log: sortedLog, completedTaskIds, toggleTask, addCustomEntry, deleteEntry }
}
