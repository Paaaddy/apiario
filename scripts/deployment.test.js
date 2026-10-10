// @vitest-environment node
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
const automerge = readFileSync(new URL('../.github/workflows/dependabot-automerge.yml', import.meta.url), 'utf8')

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
