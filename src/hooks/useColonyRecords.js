import { useMemo } from 'react'
import { buildColonyRecords, findColonyRecord } from '../utils/colonyRecords'

export function useColonyRecords(colonies = [], inspections = [], today = null) {
  return useMemo(
    () => buildColonyRecords(colonies, inspections, today ? { today } : {}),
    [colonies, inspections, today]
  )
}

export function useSelectedColonyRecord(records, colonyId) {
  return useMemo(
    () => (colonyId ? findColonyRecord(records, colonyId) : null),
    [records, colonyId]
  )
}
