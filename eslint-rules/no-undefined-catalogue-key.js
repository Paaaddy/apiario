import { strings } from '../src/i18n/strings.js'

const definedKeys = new Set(Object.keys(strings))
const prefixes = new Set(Object.keys(strings).map((key) => key.split('_')[0]).filter(Boolean))

function isCatalogueBinding(variable) {
  if (!variable || !Array.isArray(variable.defs)) return false
  return variable.defs.some((def) => {
    if (def.type !== 'ImportBinding') return false
    const source = def.parent && def.parent.source && def.parent.source.value
    return typeof source === 'string' && /i18n\/strings(\.js)?$/.test(source)
  })
}

function findVariable(scope, name) {
  let current = scope
  while (current) {
    const fromSet = current.set && typeof current.set.get === 'function' ? current.set.get(name) : null
    if (fromSet) return fromSet
    const fromVars = Array.isArray(current.variables) ? current.variables.find((v) => v.name === name) : null
    if (fromVars) return fromVars
    current = current.upper
  }
  return null
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Catalogue references must resolve to a defined entry in src/i18n/strings.js' },
    schema: [],
    messages: {
      undefinedCatalogueKey: 'Undefined catalogue key: "{{ key }}".',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode()
    function reportKey(node, key) {
      if (typeof key !== 'string' || definedKeys.has(key)) return
      context.report({ node, messageId: 'undefinedCatalogueKey', data: { key } })
    }

    function checkRawString(node) {
      if (node.type !== 'Literal' || typeof node.value !== 'string') return
      const value = node.value
      if (definedKeys.has(value)) return
      const prefix = value.split('_')[0]
      if (!prefixes.has(prefix)) return
      if (!value.includes('_')) return
      reportKey(node, value)
    }

    return {
      Literal(node) {
        checkRawString(node)
      },
      MemberExpression(node) {
        if (!node.property) return
        if (node.object.type !== 'Identifier') return
        const scope = sourceCode.getScope ? sourceCode.getScope(node) : null
        const variable = scope ? findVariable(scope, node.object.name) : null
        if (!isCatalogueBinding(variable)) return
        let key = null
        if (node.property.type === 'Literal' && typeof node.property.value === 'string') key = node.property.value
        else if (node.property.type === 'Identifier' && !node.computed) key = node.property.name
        if (key != null) reportKey(node.property, key)
      },
    }
  },
}
