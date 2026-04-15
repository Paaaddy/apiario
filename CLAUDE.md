# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run dev -- --host 0.0.0.0   # expose on local network (use device IP:5173)
npm run build        # production build (includes PWA/Workbox precache)
npm run preview      # preview production build locally
npm test             # run tests in watch mode (Vitest)
npm run test:run     # run tests once (CI mode)
npm run test:ui      # Vitest browser UI
```

Run a single test file: `npx vitest run src/hooks/useProfile.test.js`

Add `?debug` to the URL in any environment to open the debug panel (shows localStorage state, reset buttons).

## What this is

**Apiario** — a PWA for beginner beekeepers. No backend, no account, no network required after first load. All content is static JSON bundled into the app. Fonts are self-hosted via `@fontsource` and precached by Workbox, so the app works fully offline from the very first visit.

Deployed at: https://paaaddy.github.io/apiario/

## Architecture

### App shell (`src/App.jsx`)
Single-page, tab-based. `LanguageProvider` wraps everything. `ErrorBoundary` wraps `AppContent`. `useProfile` gates the onboarding flow. After onboarding, renders three tab screens plus two persistent overlays (BottomNav, BeeFab). Tab state is local to App — no router.

### State model
- **Profile** (`useProfile`): localStorage under `apiario-profile`. Shape: `{ schemaVersion, hiveCount, climateZone, experience, onboardingDone, colonies[] }`. `schemaVersion` enables future migrations via `migrate()`. `experience` is a numeric level used to filter tasks. `colonies` is an array of `{ id, name, notes, createdAt }` objects managed via `addColony`, `updateColony`, `removeColony` helpers exposed by the hook.
- **Locale** (`LanguageContext`): localStorage under `apiario-locale`. Defaults to `'de'`. `t()` resolves `{ de, en }` bilingual objects or passes plain strings through unchanged.
- **Task log** (`useTaskLog`): localStorage under `apiario-log`. Two entry types: `task` (from season checkbox) and `custom` (free text). Capped at 500 entries. Exposes `completedTaskIds` Set for O(1) checkbox state lookup.
- **Season** (`useSeason`): pure derivation from current date + profile. Reads `src/data/seasons.json`, filters tasks by `minExperience`.
- **Diagnosis** (`DiagnoseScreen`): tree traversal through `src/data/diagnosis.json`. Nodes keyed by ID; `type: 'outcome'` nodes are terminal.

### Content data
All human-readable strings in JSON are bilingual objects `{ "de": "...", "en": "..." }`. Structural fields (`id`, `urgency`, `type`, `next`, `callExpert`, `minExperience`) are plain values.

- `src/data/seasons.json` — keyed by season name. Each season: `{ label, icon, months, tasks[] }`. Tasks: `{ id, name, why, urgency, minExperience }`.
- `src/data/diagnosis.json` — flat map of node IDs. Question nodes: `{ type, question, options[] }`. Outcome nodes: `{ type, diagnosis, actions[], callExpert }`. Root node is `"root"`.
- `src/i18n/strings.js` — all UI strings as `{ de, en }` objects. Import as `import { strings as s } from '../i18n/strings'` and resolve with `t(s.key)`.

### Screen structure
- `SeasonScreen` — sticky header, task cards with checkboxes
- `DiagnoseScreen` — branching wizard; runs `validateDiagnosisTree()` on mount in dev
- `MyHiveScreen` — composes `ColoniesSection` + `LogSection` + `ProfileSection`
- `ColoniesSection` — named colony list with add / edit / delete; state lives in `useProfile`
- `LogSection` — Verlauf log with month grouping + custom entry form
- `ProfileSection` — hive count / climate / experience option groups
- `Onboarding` — 6-step OnboardJS flow (welcome → features → hiveCount → climateZone → experience → complete) using `@onboardjs/react`. Steps are created once in a `stepsRef` and a `COMPONENT_REGISTRY` maps step keys to React components.

### Voice / hands-free
`useVoice` wraps Web Speech API (`SpeechSynthesis` + `SpeechRecognition`). Command dispatch lives in `App.jsx` — the hook itself is stateless. Voice is a progressive enhancement; the app is fully usable without it.

### PWA / offline
`vite-plugin-pwa` with Workbox `generateSW` mode. All assets, JSON data, and font WOFF2 files are precached (42 entries, ~658 KB). Fonts are self-hosted via `@fontsource` packages imported in `main.jsx` — no CDN dependency. `registerType: 'autoUpdate'` auto-installs new service workers. Build produces the SW; `dev` does not register it.

## Styling

Tailwind with custom theme tokens — use these instead of raw hex:

| Token | Usage |
|---|---|
| `bg-honey` / `text-honey` | Primary amber accent (`#f5a623`) |
| `bg-honey-dark` | Darker amber (`#e8890c`) |
| `bg-brown` / `text-brown` | Dark headings (`#3d1f00`) |
| `text-brown-mid` | Secondary text (`#92400e`) |
| `bg-cream` | Page backgrounds (`#fffbeb`) |
| `font-serif` | Playfair Display — headings, task names |
| `font-sans` | Inter — body, labels |

Custom animations: `animate-bob` (floating bee at rest), `animate-pulse-glow` (active voice button).

## Testing

Vitest + jsdom + Testing Library. Setup file: `src/test-setup.js` (imports `@testing-library/jest-dom`). Tests co-located with source files (`.test.js` / `.test.jsx`). Globals are enabled — no need to import `describe`/`it`/`expect`.

Components using `useLanguage()` need a `LanguageProvider` wrapper in tests. Pattern:
```jsx
beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })
function wrap(ui) { return render(<LanguageProvider>{ui}</LanguageProvider>) }
```

Use `findByText` (not `getByText`) for post-interaction assertions to avoid React `act()` warnings.

## Deployment

GitHub Actions deploys to GitHub Pages on every push to `master`. Build uses `--base /apiario/`. No staging environment — test locally before pushing.
