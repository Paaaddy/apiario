// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtures = []
const gitEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')))
function fixture() {
  const directory = mkdtempSync('/tmp/opencode/apiario-tools-')
  fixtures.push(directory)
  return directory
}
afterEach(() => {
  for (const directory of fixtures.splice(0)) rmSync(directory, { recursive: true, force: true })
})
function run(name, args = [], options = {}) {
  return spawnSync(process.execPath, [fileURLToPath(new URL(name, import.meta.url)), ...args], {
    encoding: 'utf8', env: gitEnv, ...options,
  })
}
function repository(directory) {
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', env: gitEnv }).trim()
  git('init', '-b', 'master')
  git('config', 'user.name', 'Tool test')
  git('config', 'user.email', 'tool-test@example.invalid')
  git('config', 'core.hooksPath', '/dev/null')
  writeFileSync(join(directory, 'tracked.txt'), 'original\n')
  git('add', '.')
  git('commit', '-m', 'fixture')
  return git
}

it('creates an isolated worktree at the exact revision without copying or changing WIP', () => {
  const root = fixture()
  const git = repository(root)
  const commit = git('rev-parse', 'HEAD')
  writeFileSync(join(root, 'tracked.txt'), 'user draft\n')
  const target = join(fixture(), 'worktree')
  const result = run('agent-worktree.mjs', [target, commit], { cwd: root })
  expect(result.status).toBe(0)
  expect(result.stdout).toContain(commit)
  expect(readFileSync(join(target, 'tracked.txt'), 'utf8')).toBe('original\n')
  expect(readFileSync(join(root, 'tracked.txt'), 'utf8')).toBe('user draft\n')
  expect(run('agent-worktree.mjs', [target, commit], { cwd: root }).status).not.toBe(0)
  expect(run('agent-worktree.mjs', [join(root, 'invalid'), 'no-such-ref'], { cwd: root }).status).not.toBe(0)
})

it('captures staged, unstaged and untracked changes and refuses to overwrite evidence', () => {
  const root = fixture()
  const git = repository(root)
  writeFileSync(join(root, 'tracked.txt'), 'staged\n')
  git('add', 'tracked.txt')
  writeFileSync(join(root, 'tracked.txt'), 'unstaged\n')
  writeFileSync(join(root, 'new test.txt'), 'untracked regression\n')
  const output = join(fixture(), 'review.diff')
  expect(run('agent-review-packet.mjs', ['HEAD', output], { cwd: root }).status).toBe(0)
  const packet = readFileSync(output, 'utf8')
  expect(packet).toContain(git('rev-parse', 'HEAD'))
  expect(packet).toContain('+unstaged')
  expect(packet).toContain('MM tracked.txt')
  expect(packet).toContain('Untracked: "new test.txt"')
  expect(packet).toContain('untracked regression')
  expect(run('agent-review-packet.mjs', ['HEAD', output], { cwd: root }).status).not.toBe(0)
  expect(readFileSync(output, 'utf8')).toBe(packet)
  expect(run('agent-review-packet.mjs', ['HEAD', join(root, 'packet')], { cwd: root }).status).not.toBe(0)
})

it('awaits all verification checks and fails when any command fails', () => {
  const root = fixture()
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'npm'), '#!/bin/sh\necho "$*" >> "$CHECK_LOG"\nsleep 0.01\nif [ "$2" = "$FAIL_CHECK" ]; then exit 7; fi\n', { mode: 0o700 })
  const log = join(root, 'checks.log')
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, CHECK_LOG: log, FAIL_CHECK: 'lint' }
  const result = run('verify.mjs', [], { env })
  expect(result.status).toBe(1)
  expect(result.stdout).toContain('lint: exit 7')
  expect(result.stdout).toContain('build -- --base /apiario/: exit 0')
  expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(4)
  expect(run('verify.mjs', [], { env: { ...env, FAIL_CHECK: '' } }).status).toBe(0)
})

it('runs both timezone checks even after failure, overriding the host timezone', () => {
  const root = fixture()
  const bin = join(root, 'bin')
  mkdirSync(bin)
  const log = join(root, 'zones.log')
  writeFileSync(join(bin, 'npm'), '#!/bin/sh\necho "$TZ $*" >> "$CHECK_LOG"\nif [ "$TZ" = Europe/Berlin ]; then exit 7; fi\n', { mode: 0o700 })
  const result = run('test-timezones.mjs', [], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CHECK_LOG: log, TZ: 'UTC' },
  })
  expect(result.status).toBe(1)
  expect(readFileSync(log, 'utf8').trim().split('\n')).toEqual([
    'Europe/Berlin run test:run -- src/utils/inspections.test.js',
    'America/Los_Angeles run test:run -- src/utils/inspections.test.js',
  ])
})
