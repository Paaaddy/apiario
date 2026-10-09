import { useCallback, useMemo } from 'react'
import { useStoredState } from './useStoredState'
import { groupByColony, latestByColony } from '../utils/inspections'
import { MAX_INSPECTIONS_PER_COLONY as MAX_PER_COLONY } from '../utils/retentionLimits'
import { isInspection, uniqueRecords, loadStoredValue } from '../utils/recordValidation'

const STORAGE_KEY = 'apiario-inspections'
const acceptsInspections = (value) => uniqueRecords(value, isInspection)

function loadInspections() {
  return loadStoredValue(STORAGE_KEY, [], acceptsInspections)
}

export function useInspections() {
  const { state: inspections, updateState: setInspections, persistenceError, retrySave, getState } =
    useStoredState(STORAGE_KEY, loadInspections, acceptsInspections)

  const addInspection = useCallback((data) => {
    return setInspections((prev) => {
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
    const current = getState()
    const entry = current.find((record) => record.id === id)
    if (entry && patch.colonyId && patch.colonyId !== entry.colonyId &&
      current.filter((record) => record.colonyId === patch.colonyId).length >= MAX_PER_COLONY) {
      return { ok: false, messageKey: 'insp_colony_full' }
    }
    return setInspections((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, ...patch, id: e.id, createdAt: e.createdAt } : e
      )
      return next
    })
  }, [setInspections, getState])

  const removeInspection = useCallback((id) => {
    return setInspections((prev) => {
      const next = prev.filter((e) => e.id !== id)
      return next
    })
  }, [setInspections])

  const removeInspectionsByColonyId = useCallback((colonyId) => {
    return setInspections((prev) => {
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
