import { configure, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import {
  SHIPPED_INSPECTIONS, SHIPPED_LOG, SHIPPED_PROFILE, INSPECTION_V2_0_0, stampedAt,
} from './utils/shippedRecordShapes.fixtures'

configure({ asyncUtilTimeout: 5000 })

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 1, 12))
  localStorage.setItem('apiario-locale', 'en')
  localStorage.setItem('apiario-profile', JSON.stringify(SHIPPED_PROFILE))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

function navigate(name) {
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))
}

it('shows an Inspection journal and task log written by shipped builds, then saves them at version 1', async () => {
  localStorage.setItem('apiario-inspections', JSON.stringify(SHIPPED_INSPECTIONS))
  localStorage.setItem('apiario-log', JSON.stringify(SHIPPED_LOG))
  render(<App />)
  navigate(/^Inspect$/)
  for (const inspection of SHIPPED_INSPECTIONS) {
    expect(await screen.findByRole('button', { name: new RegExp(`${inspection.date}.*expand`) })).toBeInTheDocument()
  }
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${INSPECTION_V2_0_0.date}.*expand`) }))
  expect(await screen.findByText('Ruhiges Volk')).toBeInTheDocument()
  expect(screen.getByText('Oxalsäure')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()

  navigate(/My Hive/)
  fireEvent.click(await screen.findByRole('button', { name: 'Log' }))
  expect(await screen.findByText('📝 Fluglochkeil entfernt')).toBeInTheDocument()
  expect(screen.getByText('✓ First hive inspection')).toBeInTheDocument()

  // Loading never rewrites storage; the next ordinary write stores version 1.
  expect(JSON.parse(localStorage.getItem('apiario-inspections'))).toEqual(SHIPPED_INSPECTIONS)
  fireEvent.click(screen.getByRole('button', { name: '+ Custom entry' }))
  fireEvent.change(screen.getByPlaceholderText('What did you do?'), { target: { value: 'Waage abgelesen' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect(await screen.findByText('📝 Waage abgelesen')).toBeInTheDocument()
  const stored = JSON.parse(localStorage.getItem('apiario-log'))
  expect(stored.schemaVersion).toBe(1)
  expect(stored.records.slice(1)).toEqual(SHIPPED_LOG.map(stampedAt(1)))
  expect(stored.records[0]).toMatchObject({ type: 'custom', text: 'Waage abgelesen', schemaVersion: 1 })
}, 20000)

it('refuses Inspections from a newer version with a clear notice and keeps them on disk', async () => {
  const future = JSON.stringify({ schemaVersion: 2, records: [{ id: 'f', colonyId: 'col-1', schemaVersion: 2 }] })
  localStorage.setItem('apiario-inspections', future)
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Some stored records come from a newer version of Apiario')
  fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))
  expect(localStorage.getItem('apiario-inspections')).toBe(future)
}, 20000)
