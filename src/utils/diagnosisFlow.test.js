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
  it('prioritizes queen, then varroa, then brood when symptoms overlap', () => {
    expect(routeFromInspection({ queenStatus: 'not_seen', varroa: 5, broodPattern: 0 })).toBe('queenless')
    expect(routeFromInspection({ queenStatus: 'seen', varroa: 5, broodPattern: 0 })).toBe('varroa-suspect')
    expect(routeFromInspection(null)).toBeNull()
  })

  it('routes Inspection anomalies to diagnosis nodes', () => {
    expect(routeFromInspection({ queenStatus: 'not_seen' })).toBe('queenless')
    expect(routeFromInspection({ varroa: 3 })).toBe('varroa-suspect')
    expect(routeFromInspection({ broodPattern: 2 })).toBe('sick-brood')
    expect(routeFromInspection({ queenStatus: 'seen', varroa: 1, broodPattern: 5 })).toBeNull()
  })
})

describe('diagnosis flow state', () => {
  it('handles deep valid paths and long cycles without recursion overflow', () => {
    const data = { root: tree.root, done: tree.done }
    for (let i = 0; i < 12000; i++) {
      data[i === 0 ? 'a' : `q${i}`] = {
        ...tree.a,
        options: [{ ...tree.a.options[0], next: i === 11999 ? 'done' : `q${i + 1}` }],
      }
    }
    expect(getDiagnosisMaxDepth(data)).toBe(12002)
    expect(buildDiagnosisFlowState({ data }).isInvalid).toBe(false)

    const cyclic = {
      ...data,
      q11999: { ...tree.a, options: [{ ...tree.a.options[0], next: 'a' }] },
    }
    expect(getDiagnosisMaxDepth(cyclic)).toBe(1)
    expect(buildDiagnosisFlowState({ data: cyclic }).isInvalid).toBe(true)
  })

  it('handles many shared paths without enumerating every route', () => {
    const data = { done: tree.done }
    for (let i = 0; i < 35; i++) {
      const next = i === 34 ? 'done' : `q${i + 1}`
      data[i === 0 ? 'root' : `q${i}`] = {
        ...tree.root,
        options: [
          { ...tree.root.options[0], next },
          { ...tree.a.options[0], next },
        ],
      }
    }
    expect(getDiagnosisMaxDepth(data)).toBe(36)
    expect(buildDiagnosisFlowState({ data }).isInvalid).toBe(false)
  })

  it('does not mutate frozen content and derives new depths for replaced data', () => {
    const freeze = (value) => {
      if (value && typeof value === 'object') {
        Object.values(value).forEach(freeze)
        Object.freeze(value)
      }
      return value
    }
    const data = freeze(structuredClone(tree))
    expect(getDiagnosisMaxDepth(data)).toBe(3)
    expect(buildDiagnosisFlowState({ data, currentNodeId: 'a', history: ['root'] }).stepLabel).toBe('02')
    const replacement = { ...data, root: { ...data.root, options: [{ ...data.root.options[0], next: 'done' }] } }
    expect(getDiagnosisMaxDepth(replacement)).toBe(2)
    expect(getDiagnosisMaxDepth(data)).toBe(3)
  })

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

  it('safely rejects a question with missing options', () => {
    const data = { root: { type: 'question', question: tree.root.question } }
    expect(getDiagnosisMaxDepth(data)).toBe(1)
    expect(buildDiagnosisFlowState({ data }).isInvalid).toBe(true)
  })

  it.each([
    null,
    { ...tree, root: null },
    { ...tree, root: { ...tree.root, options: [] } },
    { ...tree, root: { ...tree.root, options: [null] } },
    { ...tree, a: { ...tree.a, options: [{ ...tree.a.options[0], next: 'missing' }] } },
    { ...tree, a: { ...tree.a, options: [{ ...tree.a.options[0], next: 'a' }] } },
    { ...tree, a: { ...tree.a, options: [{ ...tree.a.options[0], next: 'root' }] } },
    { ...tree, done: { ...tree.done, actions: [] } },
  ])('fails closed with finite progress for an invalid graph', (data) => {
    expect(getDiagnosisMaxDepth(data)).toBe(1)
    const state = buildDiagnosisFlowState({ data })
    expect(state.isInvalid).toBe(true)
    expect(state.totalLabel).toBe('01')
  })

  it('preserves longest-path progress through shared subtrees', () => {
    const data = {
      ...tree,
      root: { ...tree.root, options: [tree.root.options[0], { ...tree.root.options[0], next: 'done' }] },
    }
    const state = buildDiagnosisFlowState({ data, currentNodeId: 'done', history: ['root', 'a'] })
    expect(state.isInvalid).toBe(false)
    expect(state.isOutcome).toBe(true)
    expect(state.stepLabel).toBe('03')
    expect(state.totalLabel).toBe('03')
    expect(getDiagnosisMaxDepth(data, 'a')).toBe(2)
  })
})
