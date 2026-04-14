# OnboardJS Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the handbuilt `Onboarding.jsx` useState wizard with a 6-step OnboardJS-powered full experience: welcome → feature overview → 3 profile questions → completion.

**Architecture:** Install `@onboardjs/core` + `@onboardjs/react`. Rewrite `Onboarding.jsx` using `OnboardingProvider` + `useOnboarding()`. Each step is a custom React component registered in a `componentRegistry` map. Answers are collected in a `useRef` via `onAnswer` callbacks passed through step payloads. The external API (`onComplete(answers)`) is unchanged so `App.jsx` needs no edits.

**Tech Stack:** React 18, @onboardjs/core@1.0.0-rc.3, @onboardjs/react@1.0.0-rc.3, Tailwind CSS, Vitest + @testing-library/react.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/screens/Onboarding.jsx` | Rewrite | 6-step OnboardJS flow with all step components |
| `src/i18n/strings.js` | Modify | Add 6 new onboarding strings |
| `src/screens/Onboarding.test.jsx` | Rewrite | Tests for new 6-step flow |
| `package.json` | Modify | Add @onboardjs/core + @onboardjs/react |

---

## Task 1: Install OnboardJS packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @onboardjs/core@1.0.0-rc.3 @onboardjs/react@1.0.0-rc.3
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify install**

```bash
npm ls @onboardjs/core @onboardjs/react
```

Expected output:
```
beekeeper-app@0.0.0
├── @onboardjs/core@1.0.0-rc.3
└── @onboardjs/react@1.0.0-rc.3
```

- [ ] **Step 3: Run existing tests to confirm baseline**

```bash
npm run test:run
```

Expected: all tests pass (currently 77). No regressions from install.

---

## Task 2: Add new i18n strings

**Files:**
- Modify: `src/i18n/strings.js`

Context: The file exports a `strings` object with bilingual `{ de, en }` entries. The onboarding section starts at line 56. We need 6 new keys for the new screens.

- [ ] **Step 1: Write the failing test**

Add to `src/screens/Onboarding.test.jsx` (at the top of the file, after imports):

```js
// Temporarily add to verify strings exist - will be replaced in Task 3
import { strings as s } from '../i18n/strings'

it('has required onboarding strings', () => {
  expect(s.onboarding_lets_go).toEqual({ de: "Los geht's", en: "Let's go" })
  expect(s.onboarding_continue).toEqual({ de: 'Weiter', en: 'Continue' })
  expect(s.onboarding_complete_title).toEqual({ de: 'Du bist startklar!', en: "You're all set!" })
  expect(s.onboarding_feature_season_desc).toBeDefined()
  expect(s.onboarding_feature_diagnose_desc).toBeDefined()
  expect(s.onboarding_feature_myhive_desc).toBeDefined()
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/screens/Onboarding.test.jsx
```

Expected: FAIL — `s.onboarding_lets_go` is undefined.

- [ ] **Step 3: Add the 6 strings to strings.js**

In `src/i18n/strings.js`, find the `// Onboarding` comment block (around line 56) and add after `onboarding_q_exp`:

```js
  onboarding_lets_go:              { de: "Los geht's",                              en: "Let's go"                                   },
  onboarding_continue:             { de: 'Weiter',                                  en: 'Continue'                                   },
  onboarding_complete_title:       { de: 'Du bist startklar!',                      en: "You're all set!"                            },
  onboarding_feature_season_desc:  { de: 'Saisonale Aufgaben für deine Völker',     en: 'Seasonal tasks for your colonies'           },
  onboarding_feature_diagnose_desc:{ de: 'Symptome prüfen und Diagnose stellen',    en: 'Check symptoms and get a diagnosis'         },
  onboarding_feature_myhive_desc:  { de: 'Verlauf führen und Profil anpassen',      en: 'Track your history and update your profile' },
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/screens/Onboarding.test.jsx
```

Expected: the `has required onboarding strings` test passes.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/strings.js src/screens/Onboarding.test.jsx
git commit -m "feat: add onboarding strings for OnboardJS flow"
```

---

## Task 3: Rewrite Onboarding.jsx

**Files:**
- Rewrite: `src/screens/Onboarding.jsx`

Context: The current file is a simple useState-based 3-step wizard. We replace it entirely with OnboardJS. The external API stays the same: `export default function Onboarding({ onComplete })` where `onComplete` receives `{ hiveCount, climateZone, experience }`.

Key OnboardJS API facts:
- `OnboardingProvider` wraps the tree; accepts `steps` array and `componentRegistry` object.
- `useOnboarding()` returns `{ state, next, renderStep }` — use inside the provider.
- `renderStep()` renders the current step's component, looked up from `componentRegistry` by `payload.componentKey`.
- Step components receive `{ payload, onDataChange }` props. Call `onDataChange(data, isValid)` to tell OnboardJS the step has valid data (needed for `state.canGoNext`).
- `next()` advances to the step defined in `nextStep`.
- Steps: `{ id, type: 'CUSTOM_COMPONENT', payload: { componentKey, ...data }, nextStep }`.

- [ ] **Step 1: Write the full Onboarding.jsx**

Replace the entire content of `src/screens/Onboarding.jsx` with:

```jsx
import { useRef } from 'react'
import { OnboardingProvider, useOnboarding } from '@onboardjs/react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import LanguageToggle from '../components/LanguageToggle'

// ── Step: Welcome ────────────────────────────────────────────────────────────

function WelcomeStep() {
  const { t } = useLanguage()
  const { next } = useOnboarding()
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
            <p className="text-brown-light mt-1 text-sm">{t(s.onboarding_subtitle)}</p>
          </div>
          <LanguageToggle />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="text-8xl mb-10 animate-bob">🐝</div>
        <button
          onClick={() => next()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-sm active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_lets_go)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Features overview ───────────────────────────────────────────────────

function FeaturesStep() {
  const { t } = useLanguage()
  const { next } = useOnboarding()
  const features = [
    { icon: '🌱', label: t(s.nav_season),   desc: t(s.onboarding_feature_season_desc)  },
    { icon: '🔎', label: t(s.nav_diagnose), desc: t(s.onboarding_feature_diagnose_desc) },
    { icon: '🐝', label: t(s.nav_myhive),   desc: t(s.onboarding_feature_myhive_desc)  },
  ]
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
          </div>
          <LanguageToggle />
        </div>
      </div>
      <div className="px-6 pt-6 flex flex-col gap-4">
        {features.map(({ icon, label, desc }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-5 py-4 border border-amber-100 shadow-sm flex items-start gap-4"
          >
            <span className="text-3xl mt-0.5">{icon}</span>
            <div>
              <p className="font-semibold text-brown">{label}</p>
              <p className="text-sm text-brown-mid mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 pt-6 pb-10">
        <button
          onClick={() => next()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-sm active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Question (reused for hiveCount, climateZone, experience) ────────────

function QuestionStep({ payload, onDataChange }) {
  const { t } = useLanguage()
  const { next } = useOnboarding()

  function handleSelect(value) {
    payload.onAnswer(payload.answerKey, value)
    onDataChange({ [payload.answerKey]: value }, true)
    next()
  }

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="flex gap-2 px-6 pt-6">
        {payload.dots.map((active, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${active ? 'bg-honey w-6' : 'bg-amber-200 w-2'}`}
          />
        ))}
      </div>

      <div className="px-6 pt-6 pb-4">
        <h2 className="font-serif text-xl text-brown font-semibold">{t(payload.question)}</h2>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {payload.options.map(({ label, value }) => (
          <button
            key={String(value)}
            onClick={() => handleSelect(value)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown font-medium shadow-sm active:bg-amber-50 transition-colors"
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step: Complete ────────────────────────────────────────────────────────────

function CompleteStep({ payload }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
          </div>
          <LanguageToggle />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-serif text-2xl font-bold text-brown mb-2">
          {t(s.onboarding_complete_title)}
        </h2>
        <p className="text-brown-mid text-sm mb-10">{t(s.onboarding_subtitle)}</p>
        <button
          onClick={payload.onFinish}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-sm active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Component registry ────────────────────────────────────────────────────────

const COMPONENT_REGISTRY = {
  welcome:  WelcomeStep,
  features: FeaturesStep,
  question: QuestionStep,
  complete: CompleteStep,
}

// ── Inner UI (must live inside OnboardingProvider) ────────────────────────────

function OnboardingUI() {
  const { renderStep, state } = useOnboarding()
  if (!state || !state.currentStep) return null
  return <>{renderStep()}</>
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const answersRef = useRef({})

  // Stable ref so the steps array (created once) can call the latest onComplete
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Steps are created once on first render and stored in a ref to keep them
  // stable (OnboardingProvider re-initialises if the steps array reference changes).
  const stepsRef = useRef(null)
  if (!stepsRef.current) {
    const onAnswer = (key, value) => {
      answersRef.current = { ...answersRef.current, [key]: value }
    }

    stepsRef.current = [
      {
        id: 'welcome',
        type: 'CUSTOM_COMPONENT',
        payload: { componentKey: 'welcome' },
        nextStep: 'features',
      },
      {
        id: 'features',
        type: 'CUSTOM_COMPONENT',
        payload: { componentKey: 'features' },
        nextStep: 'hiveCount',
      },
      {
        id: 'hiveCount',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'question',
          answerKey: 'hiveCount',
          question: s.onboarding_q_hives,
          dots: [true, false, false],
          options: [
            { label: s.hive_1,  value: 1  },
            { label: s.hive_2,  value: 2  },
            { label: s.hive_5,  value: 5  },
            { label: s.hive_10, value: 10 },
          ],
          onAnswer,
        },
        nextStep: 'climateZone',
      },
      {
        id: 'climateZone',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'question',
          answerKey: 'climateZone',
          question: s.onboarding_q_zone,
          dots: [true, true, false],
          options: [
            { label: s.zone_northern,      value: 'northern'      },
            { label: s.zone_central,       value: 'central'       },
            { label: s.zone_mediterranean, value: 'mediterranean' },
            { label: s.zone_other,         value: 'other'         },
          ],
          onAnswer,
        },
        nextStep: 'experience',
      },
      {
        id: 'experience',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'question',
          answerKey: 'experience',
          question: s.onboarding_q_exp,
          dots: [true, true, true],
          options: [
            { label: s.exp_0, value: 0 },
            { label: s.exp_1, value: 1 },
            { label: s.exp_2, value: 2 },
          ],
          onAnswer,
        },
        nextStep: 'complete',
      },
      {
        id: 'complete',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'complete',
          onFinish: () => onCompleteRef.current(answersRef.current),
        },
        nextStep: null,
      },
    ]
  }

  return (
    <OnboardingProvider steps={stepsRef.current} componentRegistry={COMPONENT_REGISTRY}>
      <OnboardingUI />
    </OnboardingProvider>
  )
}
```

- [ ] **Step 2: Run the build to check for import/syntax errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors. (Tests come next.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/Onboarding.jsx
git commit -m "feat: rewrite Onboarding with OnboardJS 6-step flow"
```

---

## Task 4: Update tests

**Files:**
- Rewrite: `src/screens/Onboarding.test.jsx`

Context: The old tests expected hive count question on step 1. Now step 1 is Welcome, step 2 is Features, steps 3–5 are questions, step 6 is completion. Tests must click through the new screens to reach each stage. The EN locale is set in `beforeEach` via localStorage.

Note: OnboardJS renders the current step via `renderStep()`. In jsdom tests, `useOnboarding()` is called inside step components — the provider must be present. Our `Onboarding` component already provides it.

- [ ] **Step 1: Write the updated test file**

Replace the entire content of `src/screens/Onboarding.test.jsx` with:

```jsx
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

  it('advances to features screen after clicking Let\'s go', async () => {
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
```

- [ ] **Step 2: Run tests to see them fail (some will pass, the flow tests may fail until we verify OnboardJS works in jsdom)**

```bash
npx vitest run src/screens/Onboarding.test.jsx 2>&1
```

Expected: string tests pass. Flow tests may fail initially — check the error. Common issue: OnboardJS may need a polyfill or have async state. If flow tests fail with "Unable to find..." errors, add a longer timeout or check if `renderStep()` renders correctly.

If tests fail because OnboardJS doesn't render in jsdom, add this to `src/test-setup.js`:

```js
// OnboardJS uses requestAnimationFrame internally
global.requestAnimationFrame = (cb) => setTimeout(cb, 0)
```

Then rerun.

- [ ] **Step 3: Run all tests to confirm no regressions**

```bash
npm run test:run
```

Expected: all tests pass including the new Onboarding tests. Total should be ≥ 77 (existing) + 9 (new) = 86 or close.

- [ ] **Step 4: Commit**

```bash
git add src/screens/Onboarding.test.jsx src/test-setup.js
git commit -m "test: update Onboarding tests for 6-step OnboardJS flow"
```

---

## Task 5: Push and verify deployment

**Files:** none (git remote operations only)

- [ ] **Step 1: Push to remote**

```bash
git push origin master
```

- [ ] **Step 2: Watch the GitHub Actions run**

```bash
gh run watch
```

Expected: build job succeeds, deploy job succeeds. Full run takes ~60s.

- [ ] **Step 3: Manual smoke test**

Open `https://paaaddy.github.io/apiario/` in a browser (or on mobile). Clear site data first to trigger onboarding.

Verify the 6-step flow:
1. Welcome screen shows with 🐝 animation and "Let's go" button
2. Features screen shows 3 cards (Season, Diagnose, My Hive)
3. Hive count question shows with 3 progress dots (1 active)
4. Climate zone question shows with 3 dots (2 active)
5. Experience question shows with 3 dots (all active)
6. Completion screen shows "You're all set!" and "Continue"
7. After clicking Continue, app loads to Season tab
8. Language toggle works on every screen

---

## Self-Review

**Spec coverage:**
- ✅ Welcome screen (step 1) with hero, tagline, CTA
- ✅ Features screen (step 2) with 3 cards
- ✅ hiveCount question (step 3) with progress dots [1,0,0]
- ✅ climateZone question (step 4) with progress dots [1,1,0]
- ✅ experience question (step 5) with progress dots [1,1,1]
- ✅ Completion screen (step 6) with "You're all set!" and Continue
- ✅ Language toggle on every step
- ✅ Progress dots only on question steps
- ✅ `onComplete({ hiveCount, climateZone, experience })` — unchanged external API
- ✅ `App.jsx` unchanged

**Placeholder scan:** None found.

**Type consistency:** `payload.answerKey` matches the keys in `answersRef.current` (`hiveCount`, `climateZone`, `experience`) and matches the shape expected by `onComplete` in `App.jsx` and `useProfile`.
