import { spawnSync } from 'node:child_process'

const checks = [
  ['lint'],
  ['test:run'],
  ['test:timezone'],
  ['build', '--', '--base', '/'],
]
let failed = false
for (const args of checks) {
  const result = spawnSync('npm', ['run', ...args], { stdio: 'inherit' })
  const status = result.status ?? 1
  console.log(`npm run ${args.join(' ')}: exit ${status}`)
  if (result.error) console.error(result.error.message)
  failed ||= status !== 0
}
process.exitCode = failed ? 1 : 0
