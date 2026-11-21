import { PREFILL_TARGETS } from './diagnosisRoute'

// The walked path lives in sessionStorage: it survives a tab switch and a
// reload, and a closed browser session starts fresh (issue #192).
export const DIAGNOSIS_PATH_KEY = 'apiario-diagnosis-path'
const PATH_VERSION = 1

function session() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function isReachable(data, from, to, index) {
  const node = data[from]
  if (node?.type === 'question' && node.options.some((option) => option.next === to)) return true
  return index === 1 && from === 'root' && PREFILL_TARGETS.includes(to)
}

// A stored path is trusted only when it is exactly a walk this tree allows:
// starts at root, every id exists, every hop is an option (or the one prefill
// hop), and nothing continues past an outcome. Anything else is discarded.
export function loadDiagnosisPath(data, storage = session()) {
  try {
    const stored = JSON.parse(storage?.getItem(DIAGNOSIS_PATH_KEY) ?? 'null')
    const path = stored?.schemaVersion === PATH_VERSION ? stored.path : null
    if (!Array.isArray(path) || path.length === 0 || path[0] !== 'root') return null
    if (!path.every((id) => typeof id === 'string' && data[id])) return null
    for (let i = 1; i < path.length; i++) {
      if (!isReachable(data, path[i - 1], path[i], i)) return null
    }
    return { history: path.slice(0, -1), currentNodeId: path[path.length - 1] }
  } catch {
    return null
  }
}

// At the start there is nothing to restore, so the key is removed.
export function saveDiagnosisPath({ history, currentNodeId }, storage = session()) {
  try {
    if (!storage) return
    if (history.length === 0 && currentNodeId === 'root') {
      storage.removeItem(DIAGNOSIS_PATH_KEY)
    } else {
      storage.setItem(DIAGNOSIS_PATH_KEY, JSON.stringify({ schemaVersion: PATH_VERSION, path: [...history, currentNodeId] }))
    }
  } catch {
    // Storage may be blocked or full; the flow still works for this mount.
  }
}
