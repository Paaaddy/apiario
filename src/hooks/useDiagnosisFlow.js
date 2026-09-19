import { useCallback, useMemo, useState } from 'react'
import diagnosisData from '../data/diagnosis.json'
import { haptics } from '../utils/haptics'
import { latestOverall } from '../utils/inspections'
import { buildDiagnosisFlowState } from '../utils/diagnosisFlow'

export function useDiagnosisFlow(inspections = [], options = {}) {
  const data = options.data ?? diagnosisData
  const tap = options.tap ?? haptics.tap
  const [currentNodeId, setCurrentNodeId] = useState('root')
  const [history, setHistory] = useState([])
  const latestInspection = useMemo(() => latestOverall(inspections), [inspections])

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
