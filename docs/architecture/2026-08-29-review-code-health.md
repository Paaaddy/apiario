# Apiario — Deep Code Health & Architecture Review

**Reviewer:** Dee, The Code Surgeon
**Date:** 2026-08-29
**Note:** Repo is on **React 19** (`package.json:22` declares `react: ^19.2.6`).

**Verdict: 8.5 / 10** — a genuinely well-layered, fully-tested, defensively-coded PWA; the only real liability is the fanned-out `theme === 'b'/'c'` hardcoded-color branching that bypasses the CSS-variable system it already defines, plus a handful of harmless dead exports.

---

## 1. Architecture Verdict

**SOUND — CLEAN FOR A FRONTEND PWA OF THIS SIZE.**

- **`src/App.jsx` (219 lines) is NOT a god-component** — a thin composition root. All five screens are `lazy()` + `Suspense`-loaded (`App.jsx:24-28`), all state lives in hooks, `AppContent` only wires props + voice-dispatch + badge logic. `handleRemoveColony` correctly lifts cascade-delete of inspections before colony removal (`App.jsx:43-46`).
- **Clean screen → hooks → utils → data layering.** `DiagnoseScreen` reads raw diagnosis JSON, routes via `utils/inspections.js:latestOverall`, keeps selection local. `SeasonScreen` delegates to `useSeason` → `utils/season.js` (pure). `utils/inspections.js` hoists `groupByColony/latestByColony/latestOverall` out of `useInspections.js` — no duplicated grouping.
- **Domain logic does NOT leak into components.** Persistence, migration, eligibility live in hooks (`useProfile.migrate` v0→v2, `useTaskLog.cap`, `useSeason` filtering). Screens consume pre-shaped props.
- **Hooks single-purpose, tested, clean APIs.** `useWakeLock`, `useAppBadge`, `usePwaInstallPrompt` correctly isolated.
- **Every storage hook follows the same guarded `load/save` convention** (try/catch around `JSON.parse`/`setItem`). Repetitive but consistent, documented in AGENTS.md.

**Weaknesses:** (a) theme branching fanned across 12 files (39 raw `theme === '…'` conditionals); (b) domain–UI theming values re-derived instead of using the CSS variables the system defines.

---

## 2. Context Split (recent commit `4909339`)

**CLEAN, well-motivated, no shadow/duplicate abstraction.**
- `src/context/language-context.js` exports only `createContext`; `LanguageContext.jsx` exports only `LanguageProvider`.
- `src/context/theme-context.js` exports `ThemeContext`; `ThemeContext.jsx` exports only `ThemeProvider`.
- The provider is the **only** redefinition of the actual value — no divergent shadow. Verified: `npm run lint` is **0 errors / 0 warnings** (the exact `react-refresh/only-export-components` warning this commit fixed).

Minor nit: default `t` in `language-context.js:9` re-implements the provider's `t` (`LanguageContext.jsx:24-31`) with a subtly different fallback (missing `value[locale]` and null-guard). Harmless as a default, but the two `t` implementations can drift.

---

## 3. Technical Debt

| # | Location | Issue | Effort |
|---|---|---|---|
| 1 | **Theme branching, 12 files / 39 sites** (`InspectionCard.jsx:33-37`, `InspectionForm.jsx:80-86`, `InspectionTab.jsx:23-27`, `TaskCard.jsx:21,71`, `InspectScreen.jsx:28,49`, etc.) | Same 3-way `theme === 'b' ? … : theme === 'c' ? …` color/border triples (`bg / ink / inkMid / border`) re-derived per component. These values already live in CSS custom properties (`index.css:7-56`: `--theme-ink`, `--theme-ink-mid`, `--theme-rule`, `--theme-card-bg`, `--theme-font-head`). E.g. `InspectionCard.jsx:35` hardcodes `#2b1d0e` = `--theme-ink` (theme B). System is **mixed**: 34 uses of `var(--theme-…)` elsewhere. Hardcoded branches will silently drift. Migrate to `var(--theme-*)` or a `useThemeTokens()` helper. | **M** |
| 2 | `src/utils/themeButtonStyle.js` (15 ln) | Hardcoded hex for theme button states — same duplication, isolated. Used by `ThemeSwitcher` + `ProfileSection`. | **S** |
| 3 | Theme C **dark diagnose** branch = fully separate render tree (`DiagnoseScreen.jsx:57-~270`), ~200 lines of inline `style={{…}}` duplicating the A/B layout. Shares only `DiagnosisResult`/`RiskNote`. Any layout change made twice. | **L** |
| 4 | `src/utils/season.js:20-33` `getSeasonWeek` | **Dead** — superseded by `getIsoWeek`; only referenced by its own test. | **S** |
| 5 | `src/hooks/useInspections.js:80-83,95` `getLatestOverall`, `:85,96` `inspectionCount` | Exposed but **never consumed** in app code. | **S** |
| 6 | `src/utils/share.js:53` `isWebShareSupported` | **Dead export** — zero references in src or tests. | **S** |
| 7 | `src/context/language-context.js:9` | Default `t` duplicates (and diverges from) provider's real `t`. Drift risk in code that never runs. | **S** |

---

## 4. Redundancy / Dead-Code List

- `getSeasonWeek` — dead (#4 above).
- `getLatestOverall`, `inspectionCount` — exposed-but-unused hook fields (#5).
- `isWebShareSupported` — dead export (#6).
- Shared/duplicated color constants across themes (#1/#2) — not "unused" but duplicative of CSS vars.
- `*Provider` files duplicate the context default value (`LanguageContext.jsx:34` vs `language-context.js:6-10`).
- **NOT dead (verified used):** `RiskNote` (TaskCard:151, DiagnosisResult:61), `HexWatermark` (9 sites), `formatShortDate`, `shareOrCopy`, `viewTransitions.runWithViewTransition`, `VoicePermissionModal`, `PwaInstallHint`.
- `DiagnoseScreen.corrupted.test.jsx` — **not** corrupt; legitimate resilience test (mocks broken tree, proves no white-screen). Runs and passes. Misleading name, intentional.

---

## 5. Data Integrity

- **`seasons.json`:** 4 keys (spring/summer/autumn/winter), 24 tasks. Well-formed (bilingual `label/name/why`, `urgency`, `minExperience`, optional `risk`/`secret`+`unlockAt`/`uniqueValue`).
- **`diagnosis.json`:** 24 nodes = 9 questions + 15 outcomes. Root is a question with 6 options. All outcomes have `callExpert`; 5 carry a `risk` (rendered by `RiskNote` via `DiagnosisResult`).
- **`validateDiagnosisTree` IS used** — dev-only `if (import.meta.env.DEV)` at both util (`validateDiagnosis.js:8`) and call site (`DiagnoseScreen.jsx:14`). Walks nodes, checks `next` pointers, required fields, `root` presence.
- **Gap:** **nothing validates `seasons.json`** — no equivalent util exists. Add a parallel `validateSeasons()` to close the loop (S effort).

---

## 6. Error Handling

**EXCELLENT — the strongest area of the codebase.**
- All `JSON.parse` guarded (try/catch): `DebugPanel.jsx:15`, `useProfile.js:68`, `useInspections.js:10`, `useTaskLog.js:10`.
- Async all handled: `useAppBadge` wraps in try/catch + `.catch(() => {})` (`useAppBadge.js:26-37`); `useWakeLock` try/catch on acquire/release + justified `eslint-disable` with thorough comment; `persistStorage.requestPersistentStorage().catch(() => {})` (`App.jsx:79`); `shareOrCopy` handles `AbortError` + clipboard fallback (`share.js:21-48`); `usePwaInstallPrompt` guards `prompt()`/`userChoice`.
- `ErrorBoundary.jsx` solid — bilingual fallback, guarded `getLocale()`, DEV-only stack, `componentDidCatch` logs.
- No stray `JSON.parse`, no missing `.catch`.

---

## 7. Lint

Ran `npm run lint` — **exit 0, 0 errors, 0 warnings** (clean). The only two warnings that ever existed (`react-refresh/only-export-components`) were fixed by commit `4909339`. One deliberate, commented `eslint-disable-next-line react-hooks/set-state-in-effect` in `useWakeLock.js:34` — documented and appropriate.

---

## 8. Naming/Consistency

- Convention actually consistent: all hook *implementations* are `.js`, all components/screens `.jsx`. The only wobble: test files `useLanguage.test.jsx`/`useTheme.test.jsx` are `.jsx` while others are `.test.js`. Cosmetic.
- Context naming triad `useX.js` (consumer) → `context/x-context.js` (primitive) → `context/XContext.jsx` (provider) is self-documenting but a reader could momentarily wonder which to import. Documented in AGENTS.md.

---

## Verdict

**8.5 / 10** — a genuinely well-layered, fully-tested, defensively-coded PWA; the only real liability is the fanned-out theme hardcoded-color branching that bypasses the CSS-variable system it already defines, plus a handful of harmless dead exports.

**Top 3 to raise it:** (1) fold the 39 theme branches into `var(--theme-*)` tokens or a shared hook; (2) split/DRY the Theme-C DiagnoseScreen render tree; (3) add a `validateSeasons()` dev check and delete `getSeasonWeek`/`getLatestOverall`/`inspectionCount`/`isWebShareSupported`.
