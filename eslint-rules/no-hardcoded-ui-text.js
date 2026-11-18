const USER_FACING_ATTRIBUTES = new Set(['aria-label', 'title', 'placeholder', 'alt'])
const HAS_LETTER = /[A-Za-z]/

function isTextNode(node) {
  return (node.type === 'JSXText' || node.type === 'Literal' || node.type === 'StringLiteral') && typeof node.value === 'string'
}

function literalValue(node) {
  return typeof node.value === 'string' ? node.value : node.raw
}

function textCandidates(node) {
  if (!node) return []
  if (node.type === 'Literal' || node.type === 'StringLiteral') {
    if (typeof node.value === 'string') return [{ node, text: node.value }]
    return []
  }
  if (node.type === 'TemplateLiteral') {
    return (node.quasis || [])
      .map((q) => ({ node: q, text: q.value && (q.value.cooked != null ? q.value.cooked : q.value.raw) }))
      .filter((c) => typeof c.text === 'string')
  }
  if (node.type === 'ConditionalExpression') {
    return [...textCandidates(node.consequent), ...textCandidates(node.alternate)]
  }
  if (node.type === 'LogicalExpression') {
    return [...textCandidates(node.left), ...textCandidates(node.right)]
  }
  return []
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'User-facing JSX text must be a bilingual { de, en } string rendered through t()',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exact text values to accept, e.g. language codes',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcodedText: 'User-facing text must be a { de, en } pair from src/i18n/strings.js, rendered through t(). Found hardcoded text: "{{ text }}".',
    },
  },
  create(context) {
    const [options = {}] = context.options
    const allow = new Set(options.allow ?? [])

    function report(node, text) {
      const trimmed = String(text).trim()
      if (!HAS_LETTER.test(trimmed) || allow.has(trimmed)) return
      context.report({ node, messageId: 'hardcodedText', data: { text: trimmed } })
    }

    function reportCandidates(candidates) {
      candidates.forEach((c) => report(c.node, c.text))
    }

    return {
      JSXText(node) {
        report(node, node.value)
      },
      JSXExpressionContainer(node) {
        const parent = node.parent
        const inChildren = parent && (parent.type === 'JSXElement' || parent.type === 'JSXFragment')
        const inUserFacingAttr = parent && parent.type === 'JSXAttribute' && USER_FACING_ATTRIBUTES.has(parent.name && parent.name.name)
        if (!inChildren && !inUserFacingAttr) return
        if (isTextNode(node.expression)) {
          report(node.expression, literalValue(node.expression))
        } else {
          reportCandidates(textCandidates(node.expression))
        }
      },
      JSXAttribute(node) {
        if (!USER_FACING_ATTRIBUTES.has(node.name && node.name.name)) return
        if (!node.value) return
        if (isTextNode(node.value)) {
          report(node.value, literalValue(node.value))
          return
        }
        if (node.value.type === 'JSXExpressionContainer') {
          if (isTextNode(node.value.expression)) {
            report(node.value.expression, literalValue(node.value.expression))
          } else {
            reportCandidates(textCandidates(node.value.expression))
          }
        }
      },
    }
  },
}
