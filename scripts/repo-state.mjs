// Report everything that exists only on this machine: unpushed commits,
// worktree-only commits, stashes, dirty files. Run before moving machines.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

// A failed command must never read as "nothing found": this report is what
// says a clone is safe to delete.
const git = (args, { cwd } = {}) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(`repo-state: cannot inspect, git ${args.join(' ')} failed: ${r.error?.message ?? r.stderr.trim()}`)
    process.exit(2)
  }
  return r.stdout.trim()
}
const lines = (text) => (text ? text.split('\n') : [])

let problems = 0
const report = (title, items) => {
  if (items.length === 0) return
  problems += items.length
  console.log(`\n${title}`)
  for (const item of items) console.log(`  ${item}`)
}

// One blank-line separated block per worktree: "worktree <dir>", "HEAD <sha>", ...
const worktrees = git(['worktree', 'list', '--porcelain'])
  .split('\n\n')
  .map((block) => Object.fromEntries(lines(block).map((line) => {
    const [key, ...rest] = line.split(' ')
    return [key, rest.join(' ')]
  })))

report('Commits not on any remote branch (all refs):',
  // Every ref, notes and custom ones included; stashes are listed separately.
  lines(git(['log', '--exclude=refs/stash', '--all', '--not', '--remotes', '--oneline'])))

for (const entry of worktrees) {
  const { worktree: dir, HEAD: head } = entry
  // HEAD comes from the listing, so commits are checked even when the
  // directory is gone. An all-zero HEAD is a branch with no commits yet.
  if ('detached' in entry && !/^0+$/.test(head)) {
    report(`Detached HEAD in ${dir} (unreachable from remotes):`,
      lines(git(['log', head, '--not', '--remotes', '--oneline', '-n', '20'])))
  }
  if ('bare' in entry) continue
  if (existsSync(dir)) {
    // The flag overrides status.showUntrackedFiles=no.
    report(`Uncommitted changes in ${dir}:`,
      lines(git(['status', '--porcelain', '--untracked-files=normal'], { cwd: dir })))
  } else {
    // Deleted, moved or unmounted look the same from here, and the clone still
    // holds this worktree's index.
    report('Worktrees that cannot be inspected (restore them, or run `git worktree prune` once sure):', [dir])
  }
}

report('Stashes:', lines(git(['stash', 'list'])))

console.log(problems === 0 ? 'repo-state: everything is on a remote' : `\nrepo-state: ${problems} item(s) exist only locally`)
process.exitCode = problems === 0 ? 0 : 1
