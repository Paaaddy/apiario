import { DIAGNOSIS_PATH_KEY, loadDiagnosisPath, saveDiagnosisPath } from './diagnosisPath'

const q = (...next) => ({
  type: 'question',
  question: { en: 'Q', de: 'Q' },
  options: next.map((n) => ({ label: { en: n, de: n }, next: n })),
})
const out = { type: 'outcome', diagnosis: { en: 'D', de: 'D' }, actions: [{ en: 'A', de: 'A' }] }
const tree = { root: q('a', 'b'), a: q('done'), b: out, done: out, queenless: out }

const store = (value) => {
  const storage = window.sessionStorage
  storage.setItem(DIAGNOSIS_PATH_KEY, typeof value === 'string' ? value : JSON.stringify(value))
  return storage
}
const stored = (path) => ({ schemaVersion: 1, path })

describe('diagnosis path storage', () => {
  it('round-trips a walked path', () => {
    saveDiagnosisPath({ history: ['root', 'a'], currentNodeId: 'done' })
    expect(loadDiagnosisPath(tree)).toEqual({ history: ['root', 'a'], currentNodeId: 'done' })
  })

  it('removes the key at the start so a reset leaves nothing behind', () => {
    saveDiagnosisPath({ history: ['root'], currentNodeId: 'a' })
    saveDiagnosisPath({ history: [], currentNodeId: 'root' })
    expect(sessionStorage.getItem(DIAGNOSIS_PATH_KEY)).toBeNull()
    expect(loadDiagnosisPath(tree)).toBeNull()
  })

  it('accepts the one prefill hop from root', () => {
    store(stored(['root', 'queenless']))
    expect(loadDiagnosisPath(tree)).toEqual({ history: ['root'], currentNodeId: 'queenless' })
  })

  it.each([
    ['an unknown node id', stored(['root', 'gone'])],
    ['a path not starting at root', stored(['a', 'done'])],
    ['a hop that is not an option', stored(['root', 'done'])],
    ['a prefill hop past the first step', stored(['root', 'a', 'queenless'])],
    ['a walk continuing past an outcome', stored(['root', 'b', 'a'])],
    ['an empty path', stored([])],
    ['a non-array path', { schemaVersion: 1, path: 'root' }],
    ['a non-string id', stored(['root', 7])],
    ['a different version', { schemaVersion: 2, path: ['root', 'a'] }],
    ['malformed JSON', '{not json'],
    ['a bare null', 'null'],
  ])('discards %s', (_, value) => {
    expect(loadDiagnosisPath(tree, store(value))).toBeNull()
  })

  it('discards a path when the tree changed and the node no longer exists', () => {
    store(stored(['root', 'a', 'done']))
    const updated = { root: tree.root, a: q('b'), b: out }
    expect(loadDiagnosisPath(updated)).toBeNull()
  })

  it('does not throw when storage is blocked', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(loadDiagnosisPath(tree, blocked)).toBeNull()
    expect(() => saveDiagnosisPath({ history: ['root'], currentNodeId: 'a' }, blocked)).not.toThrow()
    expect(() => saveDiagnosisPath({ history: [], currentNodeId: 'root' }, blocked)).not.toThrow()
  })
})
