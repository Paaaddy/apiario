import { configure, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

configure({ asyncUtilTimeout: 5000 })

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  localStorage.setItem('apiario-locale', 'en')
  localStorage.setItem('apiario-profile', JSON.stringify({
    schemaVersion: 3, onboardingDone: true, experience: 1, climateZone: 'central',
    colonies: [{ id: 'a', name: 'Apple' }],
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

async function openBackupControls() {
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /My Hive/ }))
  fireEvent.click(await screen.findByRole('button', { name: /^Profile$/ }))
  fireEvent.click(await screen.findByRole('button', { name: /Data & backup/ }))
  return screen.getByRole('button', { name: 'Import from file' }).parentElement.querySelector('input[type=file]')
}

it('keeps edits made during recovery unsaved until the prior dataset is recovered', async () => {
  const previous = localStorage.getItem('apiario-profile')
  render(<App />)
  await screen.findByRole('region', { name: 'Next actions' })
  const input = await openBackupControls()
  const write = Storage.prototype.setItem
  const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === 'apiario-inspections' || (key === 'apiario-profile' && value === previous)) {
      throw new DOMException('Full', 'QuotaExceededError')
    }
    return write.call(this, key, value)
  })
  const file = new File([JSON.stringify({
    format: 'apiario-backup', schemaVersion: 2,
    data: { profile: { schemaVersion: 3, colonies: [] }, inspections: [], log: [] },
  })], 'backup.json', { type: 'application/json' })
  fireEvent.change(input, { target: { files: [file] } })
  await screen.findByRole('button', { name: 'Recover previous records' })
  writes.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Experienced (4+ years)' }))
  expect(await screen.findByText('Changes are not saved. Keep the app open and retry saving.')).toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('apiario-profile')).experience).not.toBe(2)
  fireEvent.click(screen.getByRole('button', { name: 'Recover previous records' }))
  expect(localStorage.getItem('apiario-profile')).toBe(previous)
  fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))
  expect(JSON.parse(localStorage.getItem('apiario-profile'))).toMatchObject({ experience: 2, colonies: [{ id: 'a' }] })
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
}, 15000)

it('keeps recovery visible across navigation and recovers the exact prior dataset', async () => {
  const previous = localStorage.getItem('apiario-profile')
  const view = render(<App />)
  await screen.findByRole('region', { name: 'Next actions' })
  const input = await openBackupControls()
  const write = Storage.prototype.setItem
  const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === 'apiario-inspections' || (key === 'apiario-profile' && value === previous)) {
      throw new DOMException('Full', 'QuotaExceededError')
    }
    return write.call(this, key, value)
  })
  const file = new File([JSON.stringify({
    format: 'apiario-backup', schemaVersion: 2,
    data: { profile: { schemaVersion: 3, colonies: [] }, inspections: [], log: [] },
  })], 'backup.json', { type: 'application/json' })
  fireEvent.change(input, { target: { files: [file] } })
  expect(await screen.findByRole('alert')).toHaveTextContent('Restoration and recovery failed. Do not reload')
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /Season/ }))
  expect(screen.getByRole('alert')).toHaveTextContent('retry recovering your previous records')
  writes.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Recover previous records' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(localStorage.getItem('apiario-profile')).toBe(previous)
  expect(localStorage.getItem('apiario-inspections')).toBeNull()
  expect(localStorage.getItem('apiario-log')).toBeNull()
  view.unmount()
  render(<App />)
  await screen.findByRole('region', { name: 'Next actions' })
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /My Hive/ }))
  expect(await screen.findByRole('heading', { name: /Apple/ })).toBeInTheDocument()
}, 15000)
