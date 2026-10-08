import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const [revision, destination] = process.argv.slice(2)
if (!revision || !destination) throw new Error('Usage: npm run agent:review-packet -- <base> <new-output-file>')
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const root = git('rev-parse', '--show-toplevel').trim()
const output = resolve(destination)
const withinRoot = relative(root, output)
if (!withinRoot.startsWith('../') && withinRoot !== '..') {
  throw new Error('Store review packets outside the repository to avoid including them in later packets')
}
const base = git('rev-parse', '--verify', `${revision}^{commit}`).trim()
const head = git('rev-parse', 'HEAD').trim()
const files = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
const sections = [
  `Base: ${base}\nHEAD: ${head}\nSource: ${root}\nCaptured: ${new Date().toISOString()}\n`,
  git('status', '--short'),
  git('diff', '--no-ext-diff', '--no-textconv', '--binary', base, '--', '.'),
]
for (const file of files) {
  const contents = readFileSync(resolve(root, file))
  sections.push(`\nUntracked: ${JSON.stringify(file)}\n${contents.includes(0) ? `[binary base64]\n${contents.toString('base64')}` : contents.toString('utf8')}\n`)
}
writeFileSync(output, sections.join('\n'), { flag: 'wx', mode: 0o600 })
console.log(`Review packet: ${output}`)
