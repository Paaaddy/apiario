import { useCallback, useMemo } from 'react'
import { useSliceState } from './useSliceState'
import { colonyChronology } from '../utils/inspectionHistory'
import * as colonyData from '../utils/colonyData'
import { INSPECTION_SCHEMA_VERSION, SLICES } from '../utils/persistedSlices'

export function useInspections() {
  const { state: inspections, updateState: setInspections, persistenceError, retrySave, getState } =
    useSliceState(SLICES.inspections)

  const addInspection = useCallback((data) => {
    return setInspections((prev) =>
      colonyData.addInspection(prev, {
        id: crypto.randomUUID(),
        ...data,
        schemaVersion: INSPECTION_SCHEMA_VERSION,
        schemaVersion: INSPECTION_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
      })
    )
  }, [setInspections])

  const updateInspection = useCallback((id, patch) => {
    const outcome = colonyData.updateInspection(getState(), id, patch)
    if (!outcome.ok) return outcome
    return setInspections(() => outcome.inspections)
  }, [setInspections, getState])

  const removeInspection = useCallback((id) => {
    return setInspections((prev) => colonyData.removeInspection(prev, id))
  }, [setInspections])

  const removeInspectionsByColonyId = useCallback((colonyId) => {
    return setInspections((prev) => colonyData.removeColonyInspections(prev, colonyId))
  }, [setInspections])

  // One chronology pass feeds both accessors, so the latest a caller reads can
  // never disagree with the history it came from.
  const chronology = useMemo(() => colonyChronology(inspections), [inspections])

  const getColonyInspections = useCallback(
    (colonyId) => chronology.byColony.get(colonyId) ?? [],
    [chronology]
  )

  const getLatestInspection = useCallback(
    (colonyId) => chronology.latest.get(colonyId) ?? null,
    [chronology]
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
