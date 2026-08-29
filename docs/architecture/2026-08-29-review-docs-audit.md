# Apiario — Deep Docs & Audit-Readiness Review

**Reviewer:** Pip, The Auditor
**Date:** 2026-08-29
**Head:** `4909339` (master, clean tree)

**Verdict: 7/10** — strong, well-instrumented test suite (246/32, all green) and disciplined release process, dragged down by no export/backup path for the beekeepers' data, an absent LICENSE, and a handful of documented-but-stale claims.

---

## 1. Docs inventory

| File | What it covers | Accuracy |
|---|---|---|
| `README.md` | Features, tech stack, dev commands, architecture pointer, license | **STALE** — "React 19 + Vite 7" (installed Vite is **8.1.0**); "231 tests / 30 suites" (actual: **246 / 32**); claims "MIT" but **no LICENSE file exists** |
| `CLAUDE.md` (172 ln) | Full architecture, git hook, styling, gstack skill inventory, `/guard`, agent skills | Mostly **accurate**; 2 drifts below |
| `AGENTS.md` (129 ln) | Same architecture, trimmed gstack section | Conceptually mirrors CLAUDE.md but trimmed; same drifts |
| `CONTRIBUTING.md` (37 ln) | Setup, tests, lint, PR flow | **Accurate**; omits `git config core.hooksPath hooks` (covered in `hooks/README.md`) |
| `CHANGELOG.md` (225 ln) | release-please + hand-written entries, v1.0.0→2.1.11 | **2.1.0 and 2.1.4 appear twice** (mixed manual + generated blocks); stale test counts (231) |
| `TODOS.md` (7 ln) | Completed items log | **Stale** — frozen at v1.1.1 (2026-05-02); no open items tracked |
| `hooks/README.md` (42 ln) | Shared pre-commit hook usage | **Accurate** |
| `docs/agents/domain.md` | Consume `CONTEXT.md`/`docs/adr/` | Self-aware: says "proceed silently" if absent. **Neither `CONTEXT.md`, `CONTEXT-MAP.md`, nor `docs/adr/` exist** |
| `docs/agents/issue-tracker.md` | `gh` issue/PR wayfinding | **Accurate**, matches `Paaaddy/apiario` |
| `docs/workflow/qa-canary-gate.md` | QA→ship→canary→rollback playbook (DRAFT) | **Accurate**, matches `deploy.yml`; references "bumps VERSION" — no `VERSION` file, version source is `package.json` |
| `docs/architecture/2026-08-29-review.html` | Rendered architecture review (latest-inspection + voice-dispatch refactors) | One-off dated artifact (matches commit `2c6e5ec`); fine |
| `.github/` (workflows + issue/PR templates) | deploy, release (Release-Please), dependabot-automerge | **Accurate**, well-commented; tests gate the deploy |

**Missing entirely:** `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, `LICENSE`, `VERSION`. Version source of truth is `package.json` (2.1.11). **`dist/` is gitignored and NOT committed** — clean.

### Doc↔code drift (verified against source)
1. **DiagnoseScreen validation**: AGENTS.md:49 / CLAUDE.md:50 say `validateDiagnosisTree()` runs **"on mount in dev"** — actual code runs at **module scope** (`if (import.meta.env.DEV)` at `src/screens/DiagnoseScreen.jsx:14`). CHANGELOG 2.1.4 records this move; the guides weren't updated.
2. **Vite version**: docs say Vite 7; installed is 8.1.0.
3. **Test counts**: docs claim 231/30; suite is 246/32.
4. **Context file pairs**: `language-context.js` + `LanguageContext.jsx`, `theme-context.js` + `ThemeContext.jsx` are **intentional** (context primitive in `.js`, provider in `.jsx`, per `react-refresh/only-export-components`) from HEAD commit. Docs don't describe the `.js` helpers — minor gap. Provider ordering (Theme→Language→ErrorBoundary→AppContent) matches `App.jsx:210-217` exactly.

---

## 2. Test coverage reality

**Suite result (fresh):**
```
Test Files  32 passed (32)
Tests       246 passed (246)
Duration    59.77s
```
No skipped/pending/`.only`/`.todo` anywhere in `src`. The `.corrupted` file **is a legitimate, intentional resilience test** (`DiagnoseScreen.corrupted.test.jsx`: mocks tree with a broken `next` link, asserts fallback without white-screen). **Not a corrupt file** — but the name is audit-hostile.

**Co-located tests (32 files / 2,535 lines):**
- **Hooks 9/10** — all except `usePwaInstallPrompt.js`.
- **Utils 8/8** — incl. `persistStorage`, `share`, `season`, `validateDiagnosis`, `viewTransitions`, `voiceCommands`, `haptics`, `inspections`.
- **Components**: `BeeFab`, `BottomNav`, `DiagnosisResult`, `InspectionForm`, `RiskNote`, `TaskCard`, `ThemeSwitcher`, `VoicePermissionModal`.
- **Screens**: `ColoniesSection`, `DiagnoseScreen` (6) + `.corrupted` (1), `InspectionTab`, `InspectScreen`, `MyHiveScreen` (exercises ProfileSection, LogSection, myHive tab strip, inspections tab).

**Untested / never executed by any test:**
| Module | Why it matters |
|---|---|
| `src/App.jsx` (whole shell) | **Largest gap** — onboarding gate, tab/voice wiring, badge count, cascade-delete (`App.jsx:43-46`), persistent-storage request (`App.jsx:77`), DEBUG gating, install hint |
| `src/main.jsx` + `src/pwa/registerAutoUpdate.js` | Bootstrap, StrictMode, SW auto-update — zero coverage |
| `src/components/ErrorBoundary.jsx` | Imported only by App; never exercised |
| `src/components/DebugPanel.jsx` | DEV `?debug` gate only; never exercised |
| `src/screens/SeasonScreen.jsx` + `src/components/SeasonHeader.jsx` | Primary season tab has **no test at all** (TaskCard tested standalone) |
| `src/components/VoiceOverlay.jsx`, `PwaInstallHint.jsx`, `src/hooks/usePwaInstallPrompt.js` | App-scoped only |

*Indirectly exercised (rendered inside tested parents, no own test):* `HexWatermark`, `LanguageToggle`, `InspectionCard`, `InspectionScaleInput`, `MyHiveTabStrip`, `ProfileSection`.

---

## 3. Audit-readiness gaps (ranked by risk)

1. **HIGH — No export/backup/import.** All beekeeping data (profile, colonies, inspections, log) lives only in localStorage under one origin. Verified: no `export`/`download`/`backup`/`.csv` anywhere. Browser data-clear, PWA uninstall (Edge/Chrome wipe site storage), or device migration = total, silent loss. Only mitigation is the persistent-storage grant (`App.jsx:77` → `persistStorage.js`), non-user-controllable and undetectable. **A JSON export + import is the single highest-value addition.**
2. **MEDIUM-HIGH — No LICENSE file, no `license` field in `package.json`** though README claims MIT on a public, deployed repo. Legally incongruent.
3. **MEDIUM — No privacy/data-lifecycle disclosure.** Good posture (zero network calls, all fonts self-hosted, state device-local), but no statement to users that data never leaves the device, how to delete it, or that it has no cloud backup.
4. **MEDIUM — Doc drift** (DiagnoseScreen validation, Vite version, test counts, phantom `CONTEXT.md`/`docs/adr/` references).
5. **LOW-MEDIUM — Changelog duplicated version blocks** (2.1.0, 2.1.4 twice); `TODOS.md` abandoned since May.
6. **LOW — Hygiene:** `dist/` correctly ignored; pre-commit hook + `hooks/README.md` solid; release-please tags align; git tree clean. The `.corrupted.test.jsx` filename worth renaming (e.g. `DiagnoseScreen.tolerant.test.jsx`) at next touch.

---

## Verdict

**Docs & audit readiness: 7/10** — strong, well-instrumented test suite (246/32, all green) and disciplined release process, dragged down by no export/backup path for the beekeepers' data, an absent LICENSE, and a handful of documented-but-stale claims (DiagnoseScreen validation, Vite 7→8, 231→246 tests, phantom CONTEXT.md/ADR).
