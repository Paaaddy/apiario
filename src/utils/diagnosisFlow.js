import diagnosisData from '../data/diagnosis.json'

export function routeFromInspection(inspection) {
  if (!inspection) return null
  if (inspection.queenStatus === 'not_seen') return 'queenless'
  if (inspection.varroa != null && inspection.varroa >= 3) return 'varroa-suspect'
  if (inspection.broodPattern != null && inspection.broodPattern <= 2) return 'sick-brood'
  return null
}

export function getDiagnosisMaxDepth(data = diagnosisData, rootId = 'root') {
  let maxDepth = 0
  const traverse = (nodeId, depth) => {
    const node = data[nodeId]
    if (!node || node.type === 'outcome') {
      maxDepth = Math.max(maxDepth, depth)
      return
    }
    node.options.forEach((option) => traverse(option.next, depth + 1))
  }
  traverse(rootId, 1)
  return maxDepth
}

export function buildDiagnosisFlowState({
  data = diagnosisData,
  currentNodeId = 'root',
  history = [],
  latestInspection = null,
}) {
  const node = data[currentNodeId]
  const stepNumber = history.length + 1
  const totalSteps = getDiagnosisMaxDepth(data)
  const prefillNodeId = currentNodeId === 'root' ? routeFromInspection(latestInspection) : null

  return {
    currentNodeId,
    node,
    history,
    isInvalid: !node,
    isOutcome: node?.type === 'outcome',
    stepNumber,
    stepLabel: String(stepNumber).padStart(2, '0'),
    totalSteps,
    totalLabel: String(totalSteps).padStart(2, '0'),
    prefillNodeId,
    canPrefill: Boolean(prefillNodeId),
  }
}
