// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const workflowDir = new URL('../.github/workflows/', import.meta.url)

it('pins every workflow action reference to a commit hash', () => {
  const files = readdirSync(workflowDir).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
  const violations = []

  for (const file of files) {
    const content = readFileSync(join(workflowDir.pathname, file), 'utf8')
    for (const match of content.matchAll(/^\s*(?:-\s*)?uses:\s*(.+?)\s*(?:#.*)?$/gm)) {
      const ref = match[1].trim().replace(/\s+#.*$/, '')
      if (ref.startsWith('./') || ref.startsWith('docker://')) continue
      if (!/@[0-9a-f]{40}$/.test(ref)) {
        violations.push(`${file}: ${ref}`)
      }
    }
  }

  expect(violations, violations.join('\n')).toEqual([])
})