// @vitest-environment node
import { readFileSync } from 'node:fs'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
const automerge = readFileSync(new URL('../.github/workflows/dependabot-automerge.yml', import.meta.url), 'utf8')

it('lets Vite resolve font preloads for either hosting base', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  expect(html).not.toContain('/apiario/assets/')
  const preloads = [...html.matchAll(/as="font"[^>]*href="([^"]+)"/g)]
  expect(preloads).toHaveLength(4)
  for (const [, source] of preloads) {
    expect(source).toMatch(/^\/node_modules\/@fontsource-variable\//)
    expect(readFileSync(new URL(`..${source}`, import.meta.url)).length).toBeGreaterThan(0)
  }
})

it.each([
  ['push', 'current', 'current', 'true', 'branches/master'],
  ['push', 'old', 'current', 'false', 'branches/master'],
  ['pull_request', 'current', 'current', 'true', 'pulls/123'],
  ['pull_request', 'old', 'current', 'false', 'pulls/123'],
])('guards %s deployments with source %s and current head %s', (event, expected, current, fresh, endpoint) => {
  const match = workflow.match(/- name: Check deployment freshness[\s\S]*?run: \|\n([\s\S]*?)(?=      - name:)/)
  expect(match).not.toBeNull()
  const script = match[1].split('\n').map(line => line.replace(/^          /, '')).join('\n')
  const root = mkdtempSync(join(tmpdir(), 'apiario-deploy-'))
  try {
    const output = join(root, 'output')
    const calls = join(root, 'calls')
    writeFileSync(join(root, 'gh'), '#!/bin/sh\necho "$*" >> "$CALL_LOG"\nprintf "%s\\n" "$CURRENT_SHA"\n', { mode: 0o700 })
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: join(root, 'summary'), CALL_LOG: calls,
        CURRENT_SHA: current, EXPECTED_SHA: expected, EVENT_NAME: event, PR_NUMBER: '123', REPO: 'Paaaddy/apiario' },
    })
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(output, 'utf8')).toContain(`current=${fresh}`)
    expect(readFileSync(calls, 'utf8')).toContain(`repos/Paaaddy/apiario/${endpoint}`)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

it('deploys verified root assets to Cloudflare with a consistent automation name', () => {
  expect(workflow).toContain('name: Deploy to Cloudflare Pages')
  expect(automerge).toContain('workflows: ["Deploy to Cloudflare Pages"]')
  expect(workflow).toContain('npm run verify')
  expect(workflow).toContain('needs: build')
  expect(workflow).toContain('pull-requests: read')
  expect(workflow).toContain('pages deploy dist --project-name=apiario')
  expect(workflow).toContain('github.event.pull_request.head.repo.full_name == github.repository')
  expect(workflow).not.toContain('pull_request_target:')
  expect(workflow).toContain('CLOUDFLARE_API_TOKEN')
  expect(workflow).toContain('CLOUDFLARE_ACCOUNT_ID')
})

it('publishes to Cloudflare Pages only, with no legacy GitHub Pages deployment', () => {
  expect(workflow).not.toMatch(/deploy-pages|upload-pages-artifact|dist-legacy|VITE_LEGACY_HOST|pages: write/)
  expect(workflow).toContain('github.ref == \'refs/heads/master\'')
  expect(workflow).not.toContain('paths:')
})

// Event payloads name the bot `dependabot[bot]`; `app/dependabot` is only how
// the gh CLI spells it, so a guard using that form never matches in `if:`.
it('keeps Dependabot runs away from the credentialed Cloudflare job', () => {
  const job = workflow.slice(workflow.indexOf('\n  cloudflare:'))
  expect(job).toContain("github.event.pull_request.user.login != 'dependabot[bot]'")
  expect(job).toContain("github.actor != 'dependabot[bot]'")
  expect(job).not.toContain("!= 'app/dependabot'")
})

// A merge made with GITHUB_TOKEN would not start the deploy run, so only the
// merge step gets a short-lived App token; everything else stays read-only.
it('merges with a narrowly scoped GitHub App token and no personal access token', () => {
  expect(automerge).not.toContain('DEPENDABOT_PAT')
  expect(automerge).toMatch(/\npermissions:\n  contents: read\n  pull-requests: read\n/)
  const mint = automerge.match(/- name: Mint merge token\n[\s\S]*?(?=\n\n)/)?.[0]
  expect(mint).toMatch(/uses: actions\/create-github-app-token@[0-9a-f]{40} # v\d/)
  expect(mint).toContain('client-id: ${{ secrets.AUTOMERGE_APP_CLIENT_ID }}')
  expect(mint).toContain('private-key: ${{ secrets.AUTOMERGE_APP_PRIVATE_KEY }}')
  expect(mint.match(/permission-[a-z-]+: \w+/g)).toEqual(['permission-contents: write', 'permission-pull-requests: write'])
  const condition = (step) => step.match(/if: >-\n([\s\S]*?)\n        (?:uses|env|id|with):/)?.[1]
  const mergeStep = automerge.match(/- name: Auto-merge development[\s\S]*?(?=\n\n)/)[0]
  expect(condition(mint)).toBeDefined()
  expect(condition(mint)).toBe(condition(mergeStep))
  expect(mergeStep).toContain('GH_TOKEN: ${{ steps.app-token.outputs.token }}')
})

it('names the missing credential instead of attempting an unauthenticated auto-merge', () => {
  const match = automerge.match(/- name: Auto-merge development[\s\S]*?run: \|\n([\s\S]*?)\n\n/)
  expect(match).not.toBeNull()
  // Actions expands ${{ }} before bash sees the script.
  const script = match[1].split('\n').map(line => line.replace(/^          /, '')).join('\n')
    .replace(/\$\{\{[^}]*\}\}/g, 'expression')
  const root = mkdtempSync(join(tmpdir(), 'apiario-merge-'))
  try {
    const calls = join(root, 'calls')
    writeFileSync(join(root, 'gh'), '#!/bin/sh\necho "$*" >> "$CALL_LOG"\n', { mode: 0o700 })
    const merge = (token) => spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, CALL_LOG: calls, GH_TOKEN: token, PR_NUMBER: '123', REPO: 'Paaaddy/apiario', CI_HEAD_SHA: 'abc123' },
    })
    const missing = merge('')
    expect(missing.status).toBe(1)
    expect(missing.stdout).toContain('GitHub App token')
    expect(() => readFileSync(calls)).toThrow()
    expect(merge('token').status).toBe(0)
    expect(readFileSync(calls, 'utf8')).toContain('pr merge 123')
    expect(readFileSync(calls, 'utf8')).toContain('--match-head-commit abc123')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// PRs opened with GITHUB_TOKEN do not start pull_request runs unattended, so
// the required `build` check has to be requested explicitly.
it('requests the required build check for the release pull request', () => {
  const release = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8')
  expect(release).toContain('actions: write')
  expect(release).toContain("if: steps.release.outputs.prs_created == 'true'")
  expect(release).toContain('RELEASE_PR: ${{ steps.release.outputs.pr }}')
  expect(workflow).toContain('workflow_dispatch:')
  // The runner evaluates step env before `if`, so env must also be valid when
  // there is no release PR: fromJSON('') fails the run instead of skipping.
  expect(release).not.toMatch(/\$\{\{[^}]*fromJSON/)

  const match = release.match(/- name: Run the required build check[\s\S]*?run: \|\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  const script = match[1].split('\n').map(line => line.replace(/^          /, '')).join('\n')
  const root = mkdtempSync(join(tmpdir(), 'apiario-release-'))
  try {
    const calls = join(root, 'calls')
    writeFileSync(join(root, 'gh'), '#!/bin/sh\necho "$*" >> "$CALL_LOG"\n', { mode: 0o700 })
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, CALL_LOG: calls, REPO: 'Paaaddy/apiario',
        RELEASE_PR: JSON.stringify({ headBranchName: 'release-please--branches--master' }) },
    })
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(calls, 'utf8').trim()).toBe('workflow run deploy.yml --repo Paaaddy/apiario --ref release-please--branches--master')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
