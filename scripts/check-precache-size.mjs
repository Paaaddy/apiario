import { readFileSync, statSync } from 'node:fs'

const BUDGET_BYTES = 753000

const sw = readFileSync('dist/sw.js', 'utf8')
const urls = [...new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]))]

if (urls.length === 0) {
  console.error('No precache entries found in dist/sw.js')
  process.exit(1)
}

let total = 0
for (const url of urls) {
  const relative = url.replace(/^\//, '')
  total += statSync(`dist/${relative}`).size
}

console.log(`precache: ${urls.length} entries, ${total} bytes (budget ${BUDGET_BYTES})`)

if (total > BUDGET_BYTES) {
  console.error(`Precache size ${total} exceeds budget ${BUDGET_BYTES}`)
  process.exit(1)
}
