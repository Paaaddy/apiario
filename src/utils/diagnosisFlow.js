import diagnosisData from '../data/diagnosis.json'
import { analyzeDiagnosisTree } from './validateDiagnosis'
import { routeFromInspection } from './diagnosisRoute'

export { routeFromInspection }

export function getDiagnosisMaxDepth(data = diagnosisData, rootId = 'root') {
  const analysis = analyzeDiagnosisTree(data)
  return analysis.isValid ? (analysis.depths.get(rootId) ?? 1) : 1
}

export function buildDiagnosisFlowState({
  data = diagnosisData,
  currentNodeId = 'root',
  history = [],
  latestInspection = null,
}) {
  const analysis = analyzeDiagnosisTree(data)
  const node = analysis.depths.has(currentNodeId) ? data[currentNodeId] : undefined
  const stepNumber = history.length + 1
  // The total is the steps taken plus what remains from here, and only when
  // every route onward has the same length. Otherwise it is unknown (null):
  // a guess would either end early or overshoot, and the screen shows the
  // step count alone.
  const longest = analysis.depths.get(currentNodeId)
  const nearest = analysis.shortest.get(currentNodeId)
  const pathTotal = analysis.isValid && node && longest === nearest ? history.length + longest : null
  const totalSteps = analysis.isValid ? pathTotal : 1
  const prefillNodeId = currentNodeId === 'root' ? routeFromInspection(latestInspection) : null

  return {
    currentNodeId,
    node,
    history,
    isInvalid: !analysis.isValid || !node,
    isOutcome: node?.type === 'outcome',
    stepNumber,
    stepLabel: String(stepNumber).padStart(2, '0'),
    totalSteps,
    totalLabel: totalSteps === null ? null : String(totalSteps).padStart(2, '0'),
    prefillNodeId,
    canPrefill: Boolean(prefillNodeId),
  }
}
