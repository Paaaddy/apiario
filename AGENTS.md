# AGENTS.md

Guidance for AI coding agents (Claude, Codex, Cursor, Gemini CLI, etc.) working in this repository. This file mirrors `CLAUDE.md` but is harness-agnostic.

## Commands

```bash
npm run dev          # start Vite dev server
npm run dev -- --host 0.0.0.0   # expose on local network (use device IP:5173)
npm run build        # production build (includes PWA/Workbox precache)
npm run preview      # preview production build locally
npm run lint         # ESLint (all files)
npm test             # run tests in watch mode (Vitest)
npm run test:run     # run tests once (CI mode) — use THIS for verification, not watch mode
npm run test:ui      # Vitest browser UI
```

Run a single test file: `npx vitest run src/hooks/useProfile.test.js`

Add `?debug` in dev mode (`npm run dev`) to open the debug panel (shows localStorage state, reset buttons). Absent from production builds.

## What this is

**Apiario** — an offline-first PWA for beginner beekeepers. No backend, no account, no network required after first load. All content is static JSON bundled into the app. Fonts are self-hosted via `@fontsource` and precached by Workbox, so the app works fully offline from the very first visit. Deployed at: https://paaaddy.github.io/apiario/

## Architecture

### App shell (`src/App.jsx`)
Single-page, tab-based. `ThemeProvider` wraps everything, then `LanguageProvider`, then `ErrorBoundary` wraps `AppContent`. `useProfile` gates the onboarding flow. After onboarding, renders three tab screens plus two persistent overlays (BottomNav, BeeFab). Tab state is local to App — no router.

### State model
- **Profile** (`useProfile`): localStorage under `apiario-profile`. Shape: `{ schemaVersion, hiveCount, climateZone, experience, onboardingDone, colonies[] }`. `schemaVersion` enables future migrations via `migrate()`. `experience` is a numeric level used to filter tasks. `colonies` is an array of `{ id, name, notes, createdAt }` objects managed via `addColony`, `updateColony`, `removeColony` helpers exposed by the hook.
- **Locale** (`LanguageContext`): localStorage under `apiario-locale`. Defaults to `'de'`. `t()` resolves `{ de, en }` bilingual objects or passes plain strings through unchanged.
- **Theme** (`ThemeContext`): localStorage under `apiario-theme`. Values: `'a'` (Honeycomb, default), `'b'` (Field Notebook), `'c'` (Seasonal Light). Sets `data-theme` attribute on `<html>` for CSS variable cascade. `useTheme()` returns `{ theme, setTheme }`.
- **Context split convention**: each context is split into a primitive module (`src/context/*-context.js`, exports the raw `createContext(...)` only) and a provider module (`src/context/*Context.jsx`, exports the `*Provider` component). This keeps the provider file component-only, satisfying `react-refresh/only-export-components` and preserving Fast Refresh.
- **Task log** (`useTaskLog`): localStorage under `apiario-log`. Two entry types: `task` (from season checkbox) and `custom` (free text). Capped at 500 entries. Exposes `completedTaskIds` Set for O(1) checkbox state lookup.
- **Season** (`useSeason`): pure derivation from current date + profile. Reads `src/data/seasons.json`, filters tasks by `minExperience`.
- **Inspections** (`useInspections`): localStorage under `apiario-inspections`. Shape: `{ id, colonyId, date, queenStatus, varroa, broodPattern, notes, createdAt }`. Exposes `addInspection`, `updateInspection`, `removeInspection`, `removeInspectionsByColonyId` (cascade-delete, call before `removeColony`), `getColonyInspections` (sorted newest-first), `getLatestInspection`.
- **Diagnosis** (`DiagnoseScreen`): tree traversal through `src/data/diagnosis.json`. Nodes keyed by ID; `type: 'outcome'` nodes are terminal. Accepts `inspections` prop; latest inspection auto-routes to a relevant node when queen/varroa/brood anomalies are detected.

### Content data
All human-readable strings in JSON are bilingual objects `{ "de": "...", "en": "..." }`. Structural fields (`id`, `urgency`, `type`, `next`, `callExpert`, `minExperience`) are plain values.

- `src/data/seasons.json` — keyed by season name. Each season: `{ label, icon, months, tasks[] }`. Tasks: `{ id, name, why, urgency, minExperience }`.
- `src/data/diagnosis.json` — flat map of node IDs. Question nodes: `{ type, question, options[] }`. Outcome nodes: `{ type, diagnosis, actions[], callExpert }`. Root node is `"root"`.
- `src/i18n/strings.js` — all UI strings as `{ de, en }` objects. Import as `import { strings as s } from '../i18n/strings'` and resolve with `t(s.key)`.

### Screen structure
- `SeasonScreen` — sticky header (theme A/B) or full-bleed seasonal hero (theme C), task cards with checkboxes
- `DiagnoseScreen` — branching wizard; runs `validateDiagnosisTree()` at module scope in dev (`if (import.meta.env.DEV)` in `src/screens/DiagnoseScreen.jsx`); dark background in theme C; `routeFromInspection()` maps latest inspection fields to a starting node (queenless / varroa-suspect / sick-brood)
- `InspectScreen` — top-level tab for all inspections across colonies, grouped by colony; uses `InspectionTab` internally
- `MyHiveScreen` — four-tab layout via `MyHiveTabStrip` (Colonies | Inspections | Log | Profile); tab strip lives in the sticky header of each theme branch
- `ColoniesSection` — named colony list with add / edit / delete; shows "last inspected" label per colony; "+ Inspect" shortcut opens `InspectionForm` overlay
- `InspectionTab` — all inspections for all colonies, grouped; `InspectionCard` renders one record with edit/delete; `InspectionForm` handles add/edit with `InspectionScaleInput` for 0–5 scales
- `LogSection` — Verlauf log with month grouping + custom entry form
- `ProfileSection` — hive count / climate / experience option groups + `ThemeSwitcher`
- `Onboarding` — 6-step OnboardJS flow (welcome → features → hiveCount → climateZone → experience → complete) using `@onboardjs/react`. Steps are created once in a `stepsRef` and a `COMPONENT_REGISTRY` maps step keys to React components.

### Voice / hands-free
`useVoice` wraps Web Speech API (`SpeechSynthesis` + `SpeechRecognition`). Command dispatch lives in `App.jsx` — the hook itself is stateless. Voice is a progressive enhancement; the app is fully usable without it.

### PWA / offline
`vite-plugin-pwa` with Workbox `generateSW` mode. All assets, JSON data, and font WOFF2 files are precached (56 entries, ~1074 KB). Fonts are self-hosted via `@fontsource` packages imported in `main.jsx` — no CDN dependency. `registerType: 'autoUpdate'` auto-installs new service workers. Build produces the SW; `dev` does not register it.

## Styling

### Tailwind tokens
Use these instead of raw hex values:

| Token | Usage |
|---|---|
| `bg-honey` / `text-honey` | Primary amber accent (`#f5a623`) |
| `bg-honey-dark` | Darker amber (`#e8890c`) |
| `bg-brown` / `text-brown` | Dark headings (`#3d1f00`) |
| `text-brown-mid` | Secondary text (`#92400e`) |
| `bg-cream` | Page backgrounds (`#fffbeb`) |
| `bg-paper` | Field Notebook background (`#f4ecd8`) |
| `text-ink` / `bg-ink` | Field Notebook primary text (`#2b1d0e`) |
| `text-ink-mid` | Field Notebook secondary text (`#6b5838`) |
| `text-sage` / `bg-sage` | Field Notebook done/positive (`#6f7f56`) |
| `font-serif` | Playfair Display — headings, task names |
| `font-sans` | Inter — body, labels |

Custom animations: `animate-bob` (floating bee at rest), `animate-pulse-glow` (active voice button).

### Theme system
Three themes are defined via CSS custom properties on `[data-theme="a|b|c"]` in `index.css`. Theme-aware components read `useTheme()` and branch on `theme`:

| Theme | Description |
|---|---|
| A — Honeycomb | honey chrome headers, hex watermark SVG, hex clip-path urgency pills, hex active-tab indicator in BottomNav |
| B — Field Notebook | paper (`#f4ecd8`) backgrounds everywhere, Fraunces font for headings, JetBrains Mono for labels/dates, no colored header chrome, task rows with ruled border-bottom instead of cards, SVG outline icons in BottomNav |
| C — Seasonal Light | full-bleed seasonal gradient hero in SeasonScreen (palette shifts by month), glass morphism task list (`backdrop-filter: blur`), dark moody DiagnoseScreen, floating dark pill BottomNav |

Key CSS variables (set per theme): `--theme-bg`, `--theme-header-bg`, `--theme-ink`, `--theme-ink-mid`, `--theme-ink-light`, `--theme-accent`, `--theme-rule`, `--theme-nav-bg`, `--theme-font-head`, `--theme-font-mono`.

## Testing

Vitest + jsdom + Testing Library. Setup file: `src/test-setup.js` (imports `@testing-library/jest-dom`). Tests co-located with source files (`.test.js` / `.test.jsx`). Globals are enabled — no need to import `describe`/`it`/`expect`. Run tests with `npm run test:run` (not watch mode) when verifying your work.

Components using `useLanguage()` need a `LanguageProvider` wrapper. Components using `useTheme()` also need a `ThemeProvider` wrapper. Pattern:

```jsx
beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })
function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}
```

Use `findByText` (not `getByText`) for post-interaction assertions to avoid React `act()` warnings.

## Deployment

GitHub Actions deploys to GitHub Pages on every push to `master`. Build uses `--base /apiario/`. No staging environment — verify locally (lint + `npm run test:run` + build) before pushing.

CI gates: the `build` job runs `npm run test:run` then `npm run build -- --base /apiario/`, and is a required status check on pull requests targeting `master`. A pre-commit hook runs `npm run lint` + `npm run test:run` (gated via `git config core.hooksPath hooks`).

## Repo conventions / rules of thumb

- **Obey existing conventions.** Read the surrounding code first and match its style, structure, hooks, and patterns. Do not introduce new patterns or new libraries.
- **All user-facing strings must be bilingual.** Every human-readable string is a `{ de, en }` object — never a bare string in UI text, JSON data, or `src/i18n/strings.js`.
- **Use Tailwind tokens, not raw hex.** The tokens in the Styling table are the only sanctioned colors.
- **Keep the exported hook/test conventions.** State lives in localStorage-backed hooks; tests are co-located and exported helpers are the public API of each hook.

## Workflow tooling

This repo uses [gstack](https://github.com/paaaddy/gstack) skills for planning, review, QA, and shipping. If the harness you're running under supports it, skill commands such as `/investigate` (root-cause debugging), `/qa` (systematic QA + fix loop), `/review` (pre-landing diff review), and `/ship` (version bump + changelog + PR) may be available. Invoke a skill with `/<skill-name>`; otherwise treat these as optional — the app itself is fully testable with the npm scripts above.

If present, `CONTEXT.md` and `docs/adr/` at repo root hold domain context, and `docs/agents/issue-tracker.md` covers GitHub Issues workflows via the `gh` CLI.