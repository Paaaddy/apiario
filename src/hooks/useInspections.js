import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'apiario-inspections'
const MAX_PER_COLONY = 500

function loadInspections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveInspections(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

export function useInspections() {
  const [inspections, setInspections] = useState(loadInspections)

  const addInspection = useCallback((data) => {
    setInspections((prev) => {
      const entry = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
      }
      const sameColony = prev.filter((e) => e.colonyId === data.colonyId)
      const others = prev.filter((e) => e.colonyId !== data.colonyId)
      const cappedColony = [entry, ...sameColony].slice(0, MAX_PER_COLONY)
      const next = [...cappedColony, ...others]
      saveInspections(next)
      return next
    })
  }, [])

  const updateInspection = useCallback((id, patch) => {
    setInspections((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, ...patch, id: e.id, createdAt: e.createdAt } : e
      )
      saveInspections(next)
      return next
    })
  }, [])

  const removeInspection = useCallback((id) => {
    setInspections((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveInspections(next)
      return next
    })
  }, [])

  const removeInspectionsByColonyId = useCallback((colonyId) => {
    setInspections((prev) => {
      const next = prev.filter((e) => e.colonyId !== colonyId)
      saveInspections(next)
      return next
    })
  }, [])

  const byColony = useMemo(() => {
    const map = new Map()
    for (const e of inspections) {
      const arr = map.get(e.colonyId)
      if (arr) arr.push(e)
      else map.set(e.colonyId, [e])
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => b.date.localeCompare(a.date))
    }
    return map
  }, [inspections])

  const getColonyInspections = useCallback(
    (colonyId) => byColony.get(colonyId) ?? [],
    [byColony]
  )

  const getLatestInspection = useCallback(
    (colonyId) => byColony.get(colonyId)?.[0] ?? null,
    [byColony]
  )

  const inspectionCount = inspections.length

  return {
    inspections,
    addInspection,
    updateInspection,
    removeInspection,
    removeInspectionsByColonyId,
    getColonyInspections,
    getLatestInspection,
    inspectionCount,
  }
}
