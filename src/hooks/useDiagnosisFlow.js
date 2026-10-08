import { useCallback, useMemo, useState } from 'react'
import diagnosisData from '../data/diagnosis.json'
import { haptics } from '../utils/haptics'
import { latestOverall, latestByColony } from '../utils/inspections'
import { buildDiagnosisFlowState, routeFromInspection } from '../utils/diagnosisFlow'

export function useDiagnosisFlow(inspections = [], options = {}) {
  const data = options.data ?? diagnosisData
  const tap = options.tap ?? haptics.tap
  const [currentNodeId, setCurrentNodeId] = useState('root')
  const [history, setHistory] = useState([])
  const target = options.nextAction
  const latestInspection = useMemo(() => {
    if (!target?.colonyId) return latestOverall(inspections)
    const latest = latestByColony(inspections).get(target.colonyId)
    return routeFromInspection(latest) === target.warning ? latest : null
  }, [inspections, target])

  const flow = useMemo(
    () => buildDiagnosisFlowState({ data, currentNodeId, history, latestInspection }),
    [data, currentNodeId, history, latestInspection]
  )

  const select = useCallback((nextId) => {
    tap()
    setHistory((prev) => [...prev, currentNodeId])
    setCurrentNodeId(nextId)
  }, [currentNodeId, tap])

  const reset = useCallback(() => {
    tap()
    setHistory([])
    setCurrentNodeId('root')
  }, [tap])

  const prefill = useCallback(() => {
    if (!flow.prefillNodeId) return
    tap()
    setHistory(['root'])
    setCurrentNodeId(flow.prefillNodeId)
  }, [flow.prefillNodeId, tap])

  return {
    ...flow,
    select,
    reset,
    prefill,
  }
}
