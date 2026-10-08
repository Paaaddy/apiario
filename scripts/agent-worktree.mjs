import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const [directory, revision = 'HEAD'] = process.argv.slice(2)
if (!directory) throw new Error('Usage: npm run agent:worktree -- <new-directory> [revision]')
const commit = execFileSync('git', ['rev-parse', '--verify', `${revision}^{commit}`], { encoding: 'utf8' }).trim()
const target = resolve(directory)
execFileSync('git', ['worktree', 'add', '--detach', target, commit], { stdio: 'inherit' })
console.log(`Working directory: ${target}\nRevision: ${commit}`)
