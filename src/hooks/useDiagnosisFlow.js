import { useCallback, useEffect, useMemo, useState } from 'react'
import diagnosisData from '../data/diagnosis.json'
import { haptics } from '../utils/haptics'
import { latestOverall, latestByColony } from '../utils/inspectionHistory'
import { buildDiagnosisFlowState, routeFromInspection } from '../utils/diagnosisFlow'
import { loadDiagnosisPath, saveDiagnosisPath } from '../utils/diagnosisPath'

const START = { history: [], currentNodeId: 'root' }

export function useDiagnosisFlow(inspections = [], options = {}) {
  const data = options.data ?? diagnosisData
  const tap = options.tap ?? haptics.tap
  const [path, setPath] = useState(() => loadDiagnosisPath(data, options.storage) ?? START)
  const { currentNodeId, history } = path
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

  // Every answer, step back and reset is saved, so the walk survives the
  // screen unmounting on a tab switch and a reload within the session.
  useEffect(() => {
    saveDiagnosisPath(path, options.storage)
  }, [path, options.storage])

  const select = useCallback((nextId) => {
    tap()
    setPath((prev) => ({ history: [...prev.history, prev.currentNodeId], currentNodeId: nextId }))
  }, [tap])

  const back = useCallback(() => {
    setPath((prev) => {
      if (prev.history.length === 0) return prev
      return { history: prev.history.slice(0, -1), currentNodeId: prev.history[prev.history.length - 1] }
    })
    tap()
  }, [tap])

  const reset = useCallback(() => {
    tap()
    setPath(START)
  }, [tap])

  const prefill = useCallback(() => {
    if (!flow.prefillNodeId) return
    tap()
    setPath({ history: ['root'], currentNodeId: flow.prefillNodeId })
  }, [flow.prefillNodeId, tap])

  return {
    ...flow,
    canGoBack: history.length > 0,
    select,
    back,
    reset,
    prefill,
  }
}
