import { spawnSync } from 'node:child_process'

let failed = false
for (const timezone of ['Europe/Berlin', 'America/Los_Angeles']) {
  const result = spawnSync('npm', ['run', 'test:run', '--', 'src/utils/inspections.test.js'], {
    env: { ...process.env, TZ: timezone },
    stdio: 'inherit',
  })
  const status = result.status ?? 1
  console.log(`Chronology (${timezone}): exit ${status}`)
  if (result.error) console.error(result.error.message)
  failed ||= status !== 0
}
process.exitCode = failed ? 1 : 0
