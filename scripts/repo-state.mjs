// Report everything that exists only on this machine: unpushed commits,
// worktree-only commits, stashes, dirty files. Run before moving machines.
import { spawnSync } from 'node:child_process'

const git = (args, cwd) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : ''
}
const lines = (text) => (text ? text.split('\n') : [])

let problems = 0
const report = (title, items) => {
  if (items.length === 0) return
  problems += items.length
  console.log(`\n${title}`)
  for (const item of items) console.log(`  ${item}`)
}

const worktrees = lines(git(['worktree', 'list', '--porcelain']))
  .filter((l) => l.startsWith('worktree '))
  .map((l) => l.slice('worktree '.length))

report('Commits not on any remote branch (all refs):',
  lines(git(['log', '--branches', '--tags', '--not', '--remotes', '--oneline'])))

for (const dir of worktrees) {
  const head = git(['rev-parse', 'HEAD'], dir)
  const detachedOnly = lines(git(['log', head, '--not', '--remotes', '--oneline', '-n', '20'], dir))
  const branch = git(['symbolic-ref', '--short', '-q', 'HEAD'], dir)
  if (!branch) report(`Detached HEAD in ${dir} (unreachable from remotes):`, detachedOnly)
  report(`Uncommitted changes in ${dir}:`, lines(git(['status', '--porcelain'], dir)))
}

report('Stashes:', lines(git(['stash', 'list'])))

console.log(problems === 0 ? 'repo-state: everything is on a remote' : `\nrepo-state: ${problems} item(s) exist only locally`)
process.exitCode = problems === 0 ? 0 : 1
