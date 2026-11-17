import fs from 'node:fs'
import path from 'node:path'
import { strings } from '../src/i18n/strings.js'

const definedKeys = Object.keys(strings)

function collectReferencedKeys() {
  const referenced = new Set()
  const srcDir = path.resolve(process.cwd(), 'src')
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { walk(full); continue }
      if (!/\.(js|jsx)$/.test(entry.name)) continue
      if (full.includes(`${path.sep}i18n${path.sep}strings.js`) || full.includes(`${path.sep}i18n${path.sep}backupStrings.js`)) continue
      let text = ''
      try { text = fs.readFileSync(full, 'utf8') } catch { return }
      for (const key of definedKeys) {
        // word-boundary-ish check
        const pattern = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`)
        if (pattern.test(text)) referenced.add(key)
      }
    }
  }
  try { walk(srcDir) } catch {}
  return referenced
}

const referencedKeys = collectReferencedKeys()

function isCatalogueFile(filename) {
  return /i18n[/\\]strings\.js$/.test(filename || '') || /i18n[/\\]backupStrings\.js$/.test(filename || '')
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Every catalogue entry must be referenced somewhere in the application' },
    schema: [],
    messages: {
      unreachableCatalogueKey: 'Unreachable catalogue key: "{{ key }}".',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename?.() || ''
    if (!isCatalogueFile(filename)) {
      return {}
    }
    return {
      'Program:exit'() {
        for (const key of definedKeys) {
          if (referencedKeys.has(key)) continue
          context.report({ loc: { start: { line: 1, column: 0 } }, messageId: 'unreachableCatalogueKey', data: { key } })
        }
      },
    }
  },
}
