import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../.github/workflows/', import.meta.url)
const files = readdirSync(dir).filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'))
const violations = []

for (const file of files) {
  const content = readFileSync(join(dir.pathname, file), 'utf8')
  for (const match of content.matchAll(/^\s*(?:-\s*)?uses:\s*(.+?)\s*(?:#.*)?$/gm)) {
    const ref = match[1].trim()
    if (ref.startsWith('./') || ref.startsWith('docker://')) continue
    if (!/@[0-9a-f]{40}$/.test(ref)) violations.push(`${file}: ${ref}`)
  }
}

if (violations.length) {
  console.error('Unpinned action references:')
  for (const v of violations) console.error(`  ${v}`)
  process.exit(1)
}
console.log('All workflow action references are pinned to commit hashes.')