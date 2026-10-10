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
    expect(source).toMatch(/^\/node_modules\/@fontsource\//)
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
  expect(workflow).toContain('pages deploy dist --project-name=apiario')
  expect(workflow).toContain('github.event.pull_request.head.repo.full_name == github.repository')
  expect(workflow).not.toContain('pull_request_target:')
  expect(workflow).toContain('CLOUDFLARE_API_TOKEN')
  expect(workflow).toContain('CLOUDFLARE_ACCOUNT_ID')
})

it('keeps legacy Pages available only after the Cloudflare deployment succeeds', () => {
  expect(workflow).toContain('needs: [build, cloudflare]')
  expect(workflow).toContain('VITE_LEGACY_HOST: \'true\'')
  expect(workflow).toContain('--base /apiario/ --outDir dist-legacy')
  expect(workflow).toContain('path: dist-legacy')
  expect(workflow).toContain('github.ref == \'refs/heads/master\'')
  expect(workflow).not.toContain('paths:')
})
