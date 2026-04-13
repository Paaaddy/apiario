import { useState, useMemo, useCallback } from 'react'

const STORAGE_KEY = 'apiario-log'

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

export function useTaskLog() {
  const [log, setLog] = useState(loadLog)

  const completedTaskIds = useMemo(
    () => new Set(log.filter((e) => e.type === 'task').map((e) => e.taskId)),
    [log]
  )

  const toggleTask = useCallback((task) => {
    setLog((prev) => {
      const exists = prev.find((e) => e.type === 'task' && e.taskId === task.id)
      const next = exists
        ? prev.filter((e) => !(e.type === 'task' && e.taskId === task.id))
        : [
            {
              id: `task-${task.id}-${Date.now()}`,
              type: 'task',
              taskId: task.id,
              taskName: task.name,
              completedAt: new Date().toISOString().split('T')[0],
            },
            ...prev,
          ]
      saveLog(next)
      return next
    })
  }, [])

  const addCustomEntry = useCallback(({ text, date }) => {
    setLog((prev) => {
      const next = [
        {
          id: `custom-${Date.now()}`,
          type: 'custom',
          text,
          date,
        },
        ...prev,
      ]
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
