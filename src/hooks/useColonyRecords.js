import { useMemo } from 'react'
import { buildColonyRecords, findColonyRecord } from '../utils/inspectionHistory'

/**
 * The colony record module owns what a record *is*; this hook owns when it is
 * rebuilt. Deriving records on every render would hand every consumer a fresh
 * array, so a colony list re-render would re-derive every history and re-run
 * every downstream memo. Keeping one memoised boundary here is the whole job
 * of the seam, and it is also the single place the "today" used for
 * last-inspected statuses can be injected.
 */
export function useColonyRecords(colonies = [], inspections = [], today = null) {
  return useMemo(
    () => buildColonyRecords(colonies, inspections, today ? { today } : {}),
    [colonies, inspections, today]
  )
}

/**
 * The record for the colony the user opened, or null when nothing is selected.
 */
export function useSelectedColonyRecord(records = [], colonyId) {
  return useMemo(
    () => (colonyId ? findColonyRecord(records, colonyId) : null),
    [records, colonyId]
  )
}
