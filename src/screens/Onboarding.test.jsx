import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import Onboarding from './Onboarding'
import { strings as s } from '../i18n/strings'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

// Helper: advance past welcome and features screens to reach the questions
async function advanceToQuestions(user) {
  await user.click(screen.getByRole('button', { name: "Let's go" }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
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

  it('advances to hive count question after Continue on features', async () => {
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
