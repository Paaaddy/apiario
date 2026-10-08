import diagnosisData from '../data/diagnosis.json'

const analysisCache = new WeakMap()

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isBilingual(value) {
  return isRecord(value) && ['de', 'en'].every((locale) =>
    typeof value[locale] === 'string' && value[locale].trim().length > 0)
}

/**
 * Data is immutable at this boundary: replace the node map to invalidate the
 * cached validation and longest-path depths. Does not mutate the graph.
 */
export function analyzeDiagnosisTree(data = diagnosisData) {
  if (!isRecord(data)) return deriveDiagnosisTree(data)
  if (!analysisCache.has(data)) analysisCache.set(data, deriveDiagnosisTree(data))
  return analysisCache.get(data)
}

function deriveDiagnosisTree(data) {
  const errors = []
  const depths = new Map()
  if (!isRecord(data)) {
    return { isValid: false, errors: ['diagnosis data must be a node map'], depths }
  }
  const ids = new Set(Object.keys(data))

  for (const [id, node] of Object.entries(data)) {
    if (!isRecord(node)) {
      errors.push(`[${id}] invalid node`)
      continue
    }
    if (!node.type) {
      errors.push(`[${id}] missing 'type'`)
      continue
    }
    if (node.type !== 'question' && node.type !== 'outcome') {
      errors.push(`[${id}] invalid 'type'`)
      continue
    }

    if (node.type === 'question') {
      if (!isBilingual(node.question)) errors.push(`[${id}] missing or invalid 'question'`)
      if (!Array.isArray(node.options) || node.options.length === 0) {
        errors.push(`[${id}] missing or empty 'options'`)
      } else {
        node.options.forEach((opt, i) => {
          if (!isRecord(opt)) {
            errors.push(`[${id}].options[${i}] invalid option`)
            return
          }
          if (typeof opt.next !== 'string' || !opt.next) errors.push(`[${id}].options[${i}] missing or invalid 'next'`)
          else if (!ids.has(opt.next)) errors.push(`[${id}].options[${i}] broken next: '${opt.next}'`)
          if (!isBilingual(opt.label)) errors.push(`[${id}].options[${i}] missing or invalid 'label'`)
        })
      }
    }

    if (node.type === 'outcome') {
      if (!isBilingual(node.diagnosis)) errors.push(`[${id}] missing or invalid 'diagnosis'`)
      if (!Array.isArray(node.actions) || node.actions.length === 0) {
        errors.push(`[${id}] missing or empty 'actions'`)
      } else if (!node.actions.every(isBilingual)) {
        errors.push(`[${id}] invalid 'actions'`)
      }
      if (node.callExpert !== undefined && typeof node.callExpert !== 'boolean') {
        errors.push(`[${id}] invalid 'callExpert'`)
      }
    }
  }

  if (!ids.has('root')) errors.push("missing 'root' node")

  // Only an edge back into the active path is a cycle; completed subtrees
  // may be shared. An explicit stack also handles deeply nested content.
  const edges = new Map(Object.entries(data).map(([id, node]) => [id,
    node?.type === 'question' && Array.isArray(node.options)
      ? node.options.filter((option) => typeof option?.next === 'string' && ids.has(option.next))
        .map((option) => option.next)
      : [],
  ]))
  const status = new Map()
  for (const id of ids) {
    if (status.has(id)) continue
    status.set(id, 'active')
    const stack = [{ id, index: 0 }]
    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const children = edges.get(frame.id)
      if (frame.index === children.length) {
        let depth = 1
        for (const next of children) depth = Math.max(depth, 1 + (depths.get(next) ?? 0))
        depths.set(frame.id, depth)
        status.set(frame.id, 'complete')
        stack.pop()
        continue
      }
      const next = children[frame.index++]
      if (status.get(next) === 'active') {
        errors.push(`[${frame.id}] cycle to '${next}'`)
      } else if (!status.has(next)) {
        status.set(next, 'active')
        stack.push({ id: next, index: 0 })
      }
    }
  }
  return { isValid: errors.length === 0, errors, depths }
}

/** Returns a validation result in every environment; diagnostics are dev-only. */
export function validateDiagnosisTree(data = diagnosisData) {
  const result = analyzeDiagnosisTree(data)
  if (import.meta.env.DEV) {
    if (!result.isValid) {
      console.warn('[Apiario] diagnosis.json validation errors:\n' + result.errors.join('\n'))
    } else {
      console.debug('[Apiario] diagnosis.json OK —', Object.keys(data).length, 'nodes')
    }
  }
  return result
}
