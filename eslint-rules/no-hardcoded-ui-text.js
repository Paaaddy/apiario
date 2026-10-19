/**
 * User-facing text must come from `src/i18n/strings.js` as a `{ de, en }`
 * pair, rendered through `t()`. Hardcoded text bypasses the language
 * switch, so this rule makes the bilingual contract mechanical instead of
 * relying on review to catch it.
 *
 * Flagged:
 *  - JSXText containing Latin letters (`<p>Week</p>`)
 *  - string literals in children position (`<p>{'Not enough data'}</p>`)
 *  - string literals on the user-facing attributes aria-label, title,
 *    placeholder and alt
 *
 * Not flagged: symbol-only text ('‹', '·'), whitespace, numbers, and
 * anything already routed through `t()`. Escape with a disable comment
 * that states the reason (language codes like DE/EN, dev-only panels).
 */
const USER_FACING_ATTRIBUTES = new Set(['aria-label', 'title', 'placeholder', 'alt'])
const HAS_LETTER = /[A-Za-z]/

function isTextNode(node) {
  return (node.type === 'JSXText' || node.type === 'Literal' || node.type === 'StringLiteral') && typeof node.value === 'string'
}

function literalValue(node) {
  return typeof node.value === 'string' ? node.value : node.raw
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
      const trimmed = text.trim()
      if (!HAS_LETTER.test(trimmed) || allow.has(trimmed)) return
      context.report({ node, messageId: 'hardcodedText', data: { text: trimmed } })
    }

    return {
      JSXText(node) {
        report(node, node.value)
      },
      JSXExpressionContainer(node) {
        if (isTextNode(node.expression)) report(node, literalValue(node.expression))
      },
      JSXAttribute(node) {
        if (!USER_FACING_ATTRIBUTES.has(node.name.name)) return
        if (node.value && isTextNode(node.value)) report(node.value, literalValue(node.value))
      },
    }
  },
}
