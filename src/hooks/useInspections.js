import { useCallback, useMemo } from 'react'
import { useStoredState } from './useStoredState'
import { groupByColony, latestByColony } from '../utils/inspections'
import { MAX_INSPECTIONS_PER_COLONY as MAX_PER_COLONY } from '../utils/retentionLimits'

const STORAGE_KEY = 'apiario-inspections'

function loadInspections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useInspections() {
  const { state: inspections, updateState: setInspections, persistenceError, retrySave } =
    useStoredState(STORAGE_KEY, loadInspections)

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
      return next
    })
  }, [setInspections])

  const updateInspection = useCallback((id, patch) => {
    setInspections((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, ...patch, id: e.id, createdAt: e.createdAt } : e
      )
      return next
    })
  }, [setInspections])

  const removeInspection = useCallback((id) => {
    setInspections((prev) => {
      const next = prev.filter((e) => e.id !== id)
      return next
    })
  }, [setInspections])

  const removeInspectionsByColonyId = useCallback((colonyId) => {
    setInspections((prev) => {
      const next = prev.filter((e) => e.colonyId !== colonyId)
      return next
    })
  }, [setInspections])

  const byColony = useMemo(() => groupByColony(inspections), [inspections])
  const latest = useMemo(() => latestByColony(inspections), [inspections])

  const getColonyInspections = useCallback(
    (colonyId) => byColony.get(colonyId) ?? [],
    [byColony]
  )

  const getLatestInspection = useCallback(
    (colonyId) => latest.get(colonyId) ?? null,
    [latest]
  )

  return {
    inspections,
    addInspection,
    updateInspection,
    removeInspection,
    removeInspectionsByColonyId,
    getColonyInspections,
    getLatestInspection,
    persistenceError,
    retrySave,
  }
}
