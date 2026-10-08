import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateDiagnosisTree } from './validateDiagnosis'
import diagnosisData from '../data/diagnosis.json'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
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
  it('validates bundled diagnosis content in the existing CI test gate', () => {
    const result = validateDiagnosisTree(diagnosisData)
    expect(result.errors).toEqual([])
    expect(result.isValid).toBe(true)
  })

  it('returns validation results outside development without logging', () => {
    vi.stubEnv('DEV', false)
    expect(validateDiagnosisTree(VALID_TREE).isValid).toBe(true)
    expect(validateDiagnosisTree({ root: null }).isValid).toBe(false)
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.debug).not.toHaveBeenCalled()
  })

  it('reuses analysis for immutable data and derives a replacement independently', () => {
    const data = { ...VALID_TREE }
    const result = validateDiagnosisTree(data)
    expect(validateDiagnosisTree(data)).toBe(result)

    const replacement = { ...data, root: { ...data.root, options: [] } }
    const nextResult = validateDiagnosisTree(replacement)
    expect(nextResult).not.toBe(result)
    expect(nextResult.isValid).toBe(false)
    expect(result.isValid).toBe(true)
  })

  it.each([
    { root: { ...VALID_TREE.root, options: [{ ...VALID_TREE.root.options[0], next: 'root' }] } },
    {
      root: { ...VALID_TREE.root, options: [{ ...VALID_TREE.root.options[0], next: 'a' }] },
      a: { ...VALID_TREE.root, options: [{ ...VALID_TREE.root.options[0], next: 'b' }] },
      b: { ...VALID_TREE.root, options: [{ ...VALID_TREE.root.options[0], next: 'root' }] },
    },
    {
      ...VALID_TREE,
      unreachable: { ...VALID_TREE.root, options: [{ ...VALID_TREE.root.options[0], next: 'unreachable' }] },
    },
  ])('rejects cycles anywhere in the content graph', (data) => {
    const result = validateDiagnosisTree(data)
    expect(result.isValid).toBe(false)
    expect(result.errors.join('\n')).toContain('cycle')
  })

  it('accepts shared subtrees rather than treating revisits as cycles', () => {
    const data = {
      ...VALID_TREE,
      root: {
        ...VALID_TREE.root,
        options: [
          VALID_TREE.root.options[0],
          { ...VALID_TREE.root.options[0], next: 'branch' },
        ],
      },
      branch: VALID_TREE.root,
    }
    expect(validateDiagnosisTree(data)).toMatchObject({ isValid: true, errors: [] })
  })

  it.each([
    null,
    [],
    { root: null },
    { root: {} },
    { root: { type: 'unknown' } },
    { root: { ...VALID_TREE.root, question: null } },
    { root: { ...VALID_TREE.root, question: { en: 'Only English' } } },
    { root: { ...VALID_TREE.root, options: {} } },
    { root: { ...VALID_TREE.root, options: [null] } },
    { root: { ...VALID_TREE.root, options: [{ label: VALID_TREE.root.options[0].label }] } },
    { root: { ...VALID_TREE.root, options: [{ next: 1, label: VALID_TREE.root.options[0].label }] } },
    { root: { ...VALID_TREE.root, options: [{ next: 'root', label: '' }] } },
    { root: { ...VALID_TREE['outcome-1'], actions: [] } },
    { root: { ...VALID_TREE['outcome-1'], actions: {} } },
    { root: { ...VALID_TREE['outcome-1'], actions: [null] } },
    { root: { ...VALID_TREE['outcome-1'], diagnosis: {} } },
    { root: { ...VALID_TREE['outcome-1'], callExpert: 'yes' } },
  ])('returns an invalid result for malformed content %j', (data) => {
    const result = validateDiagnosisTree(data)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

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
