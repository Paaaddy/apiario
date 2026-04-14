# OnboardJS Onboarding Design

## Goal
Replace the handbuilt `Onboarding.jsx` useState wizard with an OnboardJS-powered 6-step full experience: welcome → feature overview → 3 profile questions → completion.

## Architecture

**Libraries:** `@onboardjs/core` + `@onboardjs/react` (MIT licensed)

**Integration point:** `Onboarding.jsx` is fully replaced. External API unchanged — `onComplete(answers)` is still called with `{ hiveCount, climateZone, experience }` so `App.jsx` needs zero changes.

**Step config:** Defined as a static array. OnboardJS owns navigation state. We own rendering via a custom `renderStep` function passed to the `<OnboardingFlow>` provider.

**Answer accumulation:** Local `useState` object in the `Onboarding` component. Steps 3–5 write into it. Step 6 calls `onComplete(answers)`.

**i18n:** `useLanguage` hook available throughout. `LanguageToggle` rendered top-right on every step.

## Step Flow

| # | Key | Type | Content |
|---|-----|------|---------|
| 1 | `welcome` | display | 🍯 hero icon, "Apiario" title, tagline (`onboarding_subtitle`), "Los geht's" / "Let's go" CTA |
| 2 | `features` | display | 3 feature cards: 🌱 Saison (seasonal task guide), 🔎 Diagnose (symptom checker), 🐝 Mein Stock (hive log) — one-line description each |
| 3 | `hiveCount` | question | `onboarding_q_hives` + 4 option buttons (1, 2, 5, 10) |
| 4 | `climateZone` | question | `onboarding_q_zone` + 4 option buttons (northern, central, mediterranean, other) |
| 5 | `experience` | question | `onboarding_q_exp` + 3 option buttons (0, 1, 2) |
| 6 | `complete` | display | ✅ "Du bist startklar!" / "You're all set!", summary of chosen profile answers, "Weiter" / "Continue" button fires `onComplete` |

**Progress indicator:** Dots shown only on steps 3–5 (question phase). Steps 1, 2, 6 have no dots.

## Data Flow

1. Steps 3–5 each call a shared `handleAnswer(key, value)` that merges into local answers state and calls `goToNextStep()`.
2. Steps 1, 2 render a simple "next" button that calls `goToNextStep()`.
3. Step 6 renders a "Weiter" button that calls `onComplete(answers)`.
4. No back navigation (matches current behaviour — forward only).

## Styling

Same honey/brown/cream palette as the rest of the app. Step layout:
- Header band: `bg-honey px-6 pt-12 pb-8` with 🍯 icon + title + `LanguageToggle`
- Body: `px-6 flex flex-col gap-3`
- Option buttons: `bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown font-medium shadow-sm active:bg-amber-50`
- Feature cards (step 2): same card style with an emoji icon, bold label, and one-line description

## Files Changed

- **Modify:** `src/screens/Onboarding.jsx` — rewrite to use `@onboardjs/react`
- **No change:** `src/App.jsx`, `src/hooks/useProfile.js`, `src/i18n/strings.js`
- **Add strings (optional):** feature card descriptions for step 2 (can be hardcoded or added to strings.js)

## Out of Scope

- Back navigation
- Animations between steps (beyond existing Tailwind transitions)
- Persisting partial onboarding state across refreshes
