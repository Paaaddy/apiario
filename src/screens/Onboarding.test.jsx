import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import Onboarding from './Onboarding'
import { strings as s } from '../i18n/strings'

function makeFile(text) {
  return new File([text], 'backup.json', { type: 'application/json' })
}

function validPayload() {
  return JSON.stringify({
    format: 'apiario-backup',
    schemaVersion: 2,
    exportedAt: '2026-01-01T00:00:00.000Z',
    data: {
      profile: { hiveCount: 2, colonies: [{ id: 'col-1', name: 'A' }] },
      inspections: [{ id: 'i1' }],
      log: [{ id: 'l1' }],
    },
  })
}

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

// Helper: advance past welcome, features, and privacy screens to reach the questions
async function advanceToQuestions(user) {
  await user.click(screen.getByRole('button', { name: "Let's go" }))
  // Click Continue on features screen
  const continueButtons = screen.getAllByRole('button', { name: 'Continue' })
  await user.click(continueButtons[0])
  // Click Continue on privacy screen
  const continueButtons2 = screen.getAllByRole('button', { name: 'Continue' })
  await user.click(continueButtons2[0])
}

describe('has required strings', () => {
  it('has onboarding_lets_go', () => {
    expect(s.onboarding_lets_go).toEqual({ de: "Los geht's", en: "Let's go" })
  })
  it('has onboarding_continue', () => {
    expect(s.onboarding_continue).toEqual({ de: 'Weiter', en: 'Continue' })
  })
  it('has onboarding_complete_title', () => {
    expect(s.onboarding_complete_title).toEqual({ de: 'Du bist startklar!', en: "You're all set!" })
  })
  it('has feature description strings', () => {
    expect(s.onboarding_feature_season_desc).toBeDefined()
    expect(s.onboarding_feature_diagnose_desc).toBeDefined()
    expect(s.onboarding_feature_myhive_desc).toBeDefined()
  })
})

describe('Onboarding flow', () => {
  it('shows welcome screen first', async () => {
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText("Let's go")).toBeInTheDocument()
    })
  })

  it("advances to features screen after clicking Let's go", async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => {
      expect(screen.getByText('Season')).toBeInTheDocument()
      expect(screen.getByText('Diagnose')).toBeInTheDocument()
      expect(screen.getByText('My Hive')).toBeInTheDocument()
    })
  })

  it('advances to privacy screen after Continue on features', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => screen.getByText('Season'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => {
      expect(screen.getByText(/stored only on this device/i)).toBeInTheDocument()
    })
  })

  it('shows privacy step body and import prompt', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => screen.getByText('Season'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => {
      expect(screen.getByText(/stored only on this device/i)).toBeInTheDocument()
      expect(screen.getByText(/Already have a backup/i)).toBeInTheDocument()
    })
  })

  it('has import button on privacy step', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => screen.getByText('Season'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => {
      const importBtn = screen.getByRole('button', { name: /Import from file/i })
      expect(importBtn).toBeInTheDocument()
    })
  })

  it('advances to hive count question after Continue on privacy (without importing)', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await advanceToQuestions(user)
    await waitFor(() => {
      expect(screen.getByText(/how many hives/i)).toBeInTheDocument()
    })
  })

  it('advances to climate zone question after selecting hive count', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await advanceToQuestions(user)
    await waitFor(() => screen.getByText('1 hive'))
    await user.click(screen.getByText('1 hive'))
    await waitFor(() => {
      expect(screen.getByText(/where are you located/i)).toBeInTheDocument()
    })
  })

  it('advances to experience question after selecting climate zone', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await advanceToQuestions(user)
    await waitFor(() => screen.getByText('1 hive'))
    await user.click(screen.getByText('1 hive'))
    await waitFor(() => screen.getByText('Central Europe'))
    await user.click(screen.getByText('Central Europe'))
    await waitFor(() => {
      expect(screen.getByText(/how long have you been/i)).toBeInTheDocument()
    })
  })

  it('shows completion screen after selecting experience', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await advanceToQuestions(user)
    await waitFor(() => screen.getByText('1 hive'))
    await user.click(screen.getByText('1 hive'))
    await waitFor(() => screen.getByText('Central Europe'))
    await user.click(screen.getByText('Central Europe'))
    await waitFor(() => screen.getByText('First year'))
    await user.click(screen.getByText('First year'))
    await waitFor(() => {
      expect(screen.getByText("You're all set!")).toBeInTheDocument()
    })
  })

  it('calls onComplete with correct profile data when Continue clicked on completion screen', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    wrap(<Onboarding onComplete={onComplete} />)
    await waitFor(() => screen.getByText("Let's go"))
    await advanceToQuestions(user)
    await waitFor(() => screen.getByText('1 hive'))
    await user.click(screen.getByText('1 hive'))
    await waitFor(() => screen.getByText('Central Europe'))
    await user.click(screen.getByText('Central Europe'))
    await waitFor(() => screen.getByText('First year'))
    await user.click(screen.getByText('First year'))
    await waitFor(() => screen.getByText("You're all set!"))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onComplete).toHaveBeenCalledWith({
      hiveCount: 1,
      climateZone: 'central',
      experience: 0,
    })
  })
})

describe('Privacy step - import functionality', () => {
  it('shows error message on invalid JSON import', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => screen.getByText('Season'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText(/Already have a backup/i))

    const importBtn = screen.getByRole('button', { name: /Import from file/i })
    const fileInput = importBtn.parentElement.querySelector('input[type="file"]')

    await user.upload(fileInput, makeFile('{{{ not json'))

    await waitFor(() => {
      expect(screen.getByText(/Not a valid JSON file/i)).toBeInTheDocument()
    })
  })

  it('shows error message on wrong format file', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => screen.getByText('Season'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText(/Already have a backup/i))

    const importBtn = screen.getByRole('button', { name: /Import from file/i })
    const fileInput = importBtn.parentElement.querySelector('input[type="file"]')

    await user.upload(fileInput, makeFile(JSON.stringify({ format: 'nope', data: {} })))

    await waitFor(() => {
      expect(screen.getByText(/Not an Apiario backup file/i)).toBeInTheDocument()
    })
  })

  it('shows success message on successful import', async () => {
    const user = userEvent.setup()
    wrap(<Onboarding onComplete={() => {}} />)
    await waitFor(() => screen.getByText("Let's go"))
    await user.click(screen.getByText("Let's go"))
    await waitFor(() => screen.getByText('Season'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText(/Already have a backup/i))

    const importBtn = screen.getByRole('button', { name: /Import from file/i })
    const fileInput = importBtn.parentElement.querySelector('input[type="file"]')

    await user.upload(fileInput, makeFile(validPayload()))

    await waitFor(() => {
      expect(screen.getByText(/Reloading app/i)).toBeInTheDocument()
    })
  })
})
