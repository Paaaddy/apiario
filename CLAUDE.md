# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # production build (includes PWA/Workbox precache)
npm run preview      # preview production build locally
npm test             # run tests in watch mode (Vitest)
npm run test:run     # run tests once (CI mode)
npm run test:ui      # Vitest browser UI
```

Run a single test file: `npx vitest run src/hooks/useProfile.test.js`

## What this is

**Apiario** — a PWA for beginner beekeepers. No backend, no account, no network required after first load. All content is static JSON bundled into the app. Profile data lives in `localStorage` under `apiario-profile`.

## Architecture

### App shell (`src/App.jsx`)
Single-page, tab-based. `useProfile` gates the onboarding flow. After onboarding, renders three tab screens plus two persistent overlays (BottomNav, BeeFab). Tab state is local to App — no router.

### State model
- **Profile** (`useProfile`): thin wrapper around localStorage. Shape: `{ hiveCount, climateZone, experience, onboardingDone }`. `experience` is a numeric level used to filter tasks.
- **Season** (`useSeason`): pure derivation from current date + profile. Reads `src/data/seasons.json`, filters tasks by `minExperience`.
- **Diagnosis** (`DiagnoseScreen`): tree traversal through `src/data/diagnosis.json`. Nodes are keyed by ID; `type: 'outcome'` nodes are terminal.

### Content data
- `src/data/seasons.json` — keyed by season name (`spring`, `summer`, `autumn`, `winter`). Each season has `label`, `icon`, and `tasks[]`. Tasks have `minExperience` for filtering.
- `src/data/diagnosis.json` — flat map of node IDs → `{ type: 'question'|'outcome', question, options[] }`. Root node is `"root"`.

### Voice / hands-free
`useVoice` wraps Web Speech API (`SpeechSynthesis` + `SpeechRecognition`). Command dispatch lives in `App.jsx` — the hook itself is stateless. Voice is a progressive enhancement; the app is fully usable without it.

### PWA / offline
`vite-plugin-pwa` with Workbox. All assets + JSON precached. Google Fonts cached separately with CacheFirst (1-year TTL). Build produces the service worker; `dev` does not register it.

## Styling

Tailwind with custom theme tokens — use these instead of raw hex:

| Token | Usage |
|---|---|
| `bg-honey` / `text-honey` | Primary amber accent (`#f5a623`) |
| `bg-brown` / `text-brown` | Dark headings (`#3d1f00`) |
| `text-brown-mid` | Secondary text (`#92400e`) |
| `bg-cream` | Page backgrounds (`#fffbeb`) |
| `font-serif` | Playfair Display — headings, task names |
| `font-sans` | Inter — body, labels |

Custom animations: `animate-bob` (floating bee), `animate-pulse-glow` (active voice button).

## Testing

Vitest + jsdom + Testing Library. Setup file: `src/test-setup.js` (imports `@testing-library/jest-dom`). Tests co-located with source files (`.test.js` / `.test.jsx`). Globals are enabled — no need to import `describe`/`it`/`expect`.
