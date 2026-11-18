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
  const totalSteps = getDiagnosisMaxDepth(data)
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
    totalLabel: String(totalSteps).padStart(2, '0'),
    prefillNodeId,
    canPrefill: Boolean(prefillNodeId),
  }
}
