import {
  buildDiagnosisFlowState,
  getDiagnosisMaxDepth,
  routeFromInspection,
} from './diagnosisFlow'

const tree = {
  root: {
    type: 'question',
    question: { en: 'Root', de: 'Root' },
    options: [{ label: { en: 'A', de: 'A' }, next: 'a' }],
  },
  a: {
    type: 'question',
    question: { en: 'A?', de: 'A?' },
    options: [{ label: { en: 'Done', de: 'Done' }, next: 'done' }],
  },
  done: {
    type: 'outcome',
    diagnosis: { en: 'Done', de: 'Done' },
    actions: [{ en: 'Act', de: 'Act' }],
  },
}

describe('routeFromInspection', () => {
  it('routes Inspection anomalies to diagnosis nodes', () => {
    expect(routeFromInspection({ queenStatus: 'not_seen' })).toBe('queenless')
    expect(routeFromInspection({ varroa: 3 })).toBe('varroa-suspect')
    expect(routeFromInspection({ broodPattern: 2 })).toBe('sick-brood')
    expect(routeFromInspection({ queenStatus: 'seen', varroa: 1, broodPattern: 5 })).toBeNull()
  })
})

describe('diagnosis flow state', () => {
  it('derives progress, labels, and root prefill', () => {
    const state = buildDiagnosisFlowState({
      data: tree,
      currentNodeId: 'root',
      history: [],
      latestInspection: { queenStatus: 'not_seen' },
    })
    expect(state.node).toBe(tree.root)
    expect(state.stepNumber).toBe(1)
    expect(state.stepLabel).toBe('01')
    expect(state.totalSteps).toBe(3)
    expect(state.totalLabel).toBe('03')
    expect(state.prefillNodeId).toBe('queenless')
    expect(state.canPrefill).toBe(true)
  })

  it('marks outcome and invalid states', () => {
    expect(buildDiagnosisFlowState({ data: tree, currentNodeId: 'done' }).isOutcome).toBe(true)
    const invalid = buildDiagnosisFlowState({ data: tree, currentNodeId: 'missing', history: ['root'] })
    expect(invalid.isInvalid).toBe(true)
    expect(invalid.stepNumber).toBe(2)
  })

  it('calculates max depth from the tree', () => {
    expect(getDiagnosisMaxDepth(tree)).toBe(3)
  })
})
