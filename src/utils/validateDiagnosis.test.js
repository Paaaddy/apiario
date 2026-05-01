import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateDiagnosisTree } from './validateDiagnosis'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

const VALID_TREE = {
  root: {
    type: 'question',
    question: { de: 'Was siehst du?', en: 'What are you seeing?' },
    options: [{ next: 'outcome-1', label: { de: 'Wenig Bienen', en: 'Few bees' } }],
  },
  'outcome-1': {
    type: 'outcome',
    diagnosis: { de: 'Unbekannt', en: 'Unknown' },
    actions: [{ de: 'Kontrolliere', en: 'Inspect' }],
  },
}

describe('validateDiagnosisTree', () => {
  it('valid tree passes without warnings', () => {
    validateDiagnosisTree(VALID_TREE)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('missing root node is flagged', () => {
    const tree = {
      'some-node': {
        type: 'outcome',
        diagnosis: { de: 'Test', en: 'Test' },
        actions: [{ de: 'Do it', en: 'Do it' }],
      },
    }
    validateDiagnosisTree(tree)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("missing 'root' node")
    )
  })

  it('node with broken next pointer is flagged', () => {
    const tree = {
      root: {
        type: 'question',
        question: { de: 'Frage?', en: 'Question?' },
        options: [{ next: 'nonexistent-id', label: { de: 'Option', en: 'Option' } }],
      },
    }
    validateDiagnosisTree(tree)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("broken next: 'nonexistent-id'")
    )
  })

  it('outcome node with callExpert: true passes without warnings', () => {
    const tree = {
      root: {
        type: 'question',
        question: { de: 'Frage?', en: 'Question?' },
        options: [{ next: 'expert-outcome', label: { de: 'Option', en: 'Option' } }],
      },
      'expert-outcome': {
        type: 'outcome',
        diagnosis: { de: 'Experte', en: 'Expert' },
        actions: [{ de: 'Ruf an', en: 'Call' }],
        callExpert: true,
      },
    }
    validateDiagnosisTree(tree)
    expect(console.warn).not.toHaveBeenCalled()
  })
})
