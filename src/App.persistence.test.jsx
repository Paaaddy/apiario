import { StrictMode } from 'react'
import { configure, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

configure({ asyncUtilTimeout: 5000 })

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 3, 15, 12))
  localStorage.setItem('apiario-locale', 'en')
  localStorage.setItem('apiario-profile', JSON.stringify({
    schemaVersion: 3, onboardingDone: true, climateZone: 'central', experience: 1,
    colonies: [{ id: 'a', name: 'Apple' }],
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
})

function failWritesFor(storageKey) {
  const write = Storage.prototype.setItem
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === storageKey) throw new DOMException('Full', 'QuotaExceededError')
    return write.call(this, key, value)
  })
}

it('shows unsaved Inspection feedback in both languages and retries without duplicating records', async () => {
  render(<StrictMode><App /></StrictMode>)
  await screen.findByRole('region', { name: 'Next actions' })
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /^Inspect$/ }))
  fireEvent.click(await screen.findByRole('button', { name: '+ Inspect', exact: true }))
  await screen.findByRole('dialog', { name: 'New inspection' })
  fireEvent.click(screen.getByRole('button', { name: /👑 Seen/ }))
  const writes = failWritesFor('apiario-inspections')
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Changes are not saved. Keep the app open and retry saving.')
  expect(localStorage.getItem('apiario-inspections')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'DE', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Änderungen sind nicht gespeichert.')
  writes.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Speichern erneut versuchen' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('apiario-inspections'))).toHaveLength(1)
}, 15000)

it('keeps failed task completion visible as unsaved and persists it on retry', async () => {
  render(<App />)
  await screen.findByRole('region', { name: 'Next actions' })
  const writes = failWritesFor('apiario-log')
  fireEvent.click(screen.getAllByRole('button', { name: 'Check task', exact: true })[0])
  expect(await screen.findByRole('alert')).toHaveTextContent('Changes are not saved.')
  expect(screen.getByRole('button', { name: 'Uncheck task', exact: true })).toBeInTheDocument()
  expect(localStorage.getItem('apiario-log')).toBeNull()
  writes.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('apiario-log'))).toHaveLength(1)
}, 15000)

it('does not call a failed Profile change saved and retries the latest changes', async () => {
  render(<App />)
  await screen.findByRole('region', { name: 'Next actions' })
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /My Hive/ }))
  fireEvent.click(await screen.findByRole('button', { name: /^Profile$/ }))
  const writes = failWritesFor('apiario-profile')
  fireEvent.click(await screen.findByRole('button', { name: 'Experienced (4+ years)' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Changes are not saved.')
  expect(JSON.parse(localStorage.getItem('apiario-profile')).experience).toBe(1)
  writes.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('apiario-profile')).experience).toBe(2)
}, 15000)
