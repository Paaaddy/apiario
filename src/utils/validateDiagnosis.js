import diagnosisData from '../data/diagnosis.json'

/**
 * Dev-only: walks the diagnosis tree and logs any broken `next` pointers
 * or missing required fields. Called once on mount in DiagnoseScreen.
 */
export function validateDiagnosisTree(data = diagnosisData) {
  if (!import.meta.env.DEV) return

  const errors = []
  const ids = new Set(Object.keys(data))

  for (const [id, node] of Object.entries(data)) {
    if (!node.type) {
      errors.push(`[${id}] missing 'type'`)
      continue
    }

    if (node.type === 'question') {
      if (!node.question) errors.push(`[${id}] missing 'question'`)
      if (!Array.isArray(node.options) || node.options.length === 0) {
        errors.push(`[${id}] missing or empty 'options'`)
      } else {
        node.options.forEach((opt, i) => {
          if (!opt.next) errors.push(`[${id}].options[${i}] missing 'next'`)
          else if (!ids.has(opt.next)) errors.push(`[${id}].options[${i}] broken next: '${opt.next}'`)
          if (!opt.label) errors.push(`[${id}].options[${i}] missing 'label'`)
        })
      }
    }

    if (node.type === 'outcome') {
      if (!node.diagnosis) errors.push(`[${id}] missing 'diagnosis'`)
      if (!Array.isArray(node.actions) || node.actions.length === 0) {
        errors.push(`[${id}] missing or empty 'actions'`)
      }
    }
  }

  if (!ids.has('root')) errors.push("missing 'root' node")

  if (errors.length > 0) {
    console.warn('[Apiario] diagnosis.json validation errors:\n' + errors.join('\n'))
  } else {
    console.debug('[Apiario] diagnosis.json OK —', ids.size, 'nodes')
  }
}
