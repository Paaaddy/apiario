import { act, configure, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

configure({ asyncUtilTimeout: 5000 })

const TITLE = /faster access like a native app/i

function seed() {
  localStorage.setItem('apiario-locale', 'en')
  localStorage.setItem('apiario-profile', JSON.stringify({
    schemaVersion: 3, onboardingDone: true, climateZone: 'central',
    experience: 1, hiveCount: 1, colonies: [{ id: 'a', name: 'Apple' }],
  }))
}

function goTo(name) {
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  seed()
})
afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

async function installable() {
  const view = render(<App />)
  await screen.findByRole('navigation')
  act(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    event.prompt = vi.fn()
    event.userChoice = Promise.resolve({ outcome: 'dismissed' })
    window.dispatchEvent(event)
  })
  return view
}

describe('Install hint in the app shell', () => {
  it('appears when the app is installable and not dismissed', async () => {
    await installable()
    expect(screen.getByRole('button', { name: /install now/i })).toBeInTheDocument()
  })

  it.each(['Season', 'Diagnose', 'Inspect', 'Learn', 'My Hive'])(
    'renders exactly one install hint on the %s screen',
    async (tab) => {
      await installable()
      goTo(tab)
      expect(await screen.findAllByText(TITLE)).toHaveLength(1)
    }
  )

  it('keeps the hint hidden after dismissal and a fresh mount', async () => {
    const first = await installable()
    fireEvent.click(screen.getByRole('button', { name: /dismiss install hint/i }))
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
    first.unmount()

    await installable()
    goTo('My Hive')
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
  })
})
