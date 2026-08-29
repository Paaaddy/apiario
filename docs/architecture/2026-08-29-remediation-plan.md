# Apiario — Remediation Plan (from CTO Review)

**Date:** 2026-08-29
**Source:** `docs/architecture/2026-08-29-team-review.md` (multi-agent CTO review)
**Status:** Approved — executing
**Git strategy:** one feature branch + one PR per workstream; merged through an integration branch after the final QC gate.

---

## Scope decision

All implementable code-level fixes from the CTO review, including the large theme refactor and a user-facing privacy disclosure. 

**Deferred (human/product decisions, not code):**
- External beekeeper content validation (diagnosis tree + seasonal tasks trust surface)
- Usage telemetry / feedback loop
- Multi-device / cloud sync

---

## Workstreams (one subagent each, branch-isolated)

### WS1 — Fix colony seeding at onboarding (`fix/onboard-colony-seeding`)
**Why (Sam / Ada #2):** new users who answer "5 hives" land on an **empty** hive list — `hiveCount` only seeds `colonies[]` in the legacy migration, not fresh onboarding (`App.jsx:138` vs `useProfile.js:47-59`).
**Changes:**
- `src/App.jsx:138` — `onComplete` seeds `colonies` from `answers.hiveCount` when `profile.colonies` is empty.
- `src/hooks/useProfile.js` — extract a shared seeding helper (migration + onboarding use one path).
- Tests in `useProfile.test.js` + App-level handler coverage.
**Verify:** `npm run test:run`, lint, manual onboarding flow.

### WS2 — JSON export + import (data backup) (`feat/data-export-import`)
**Why (Pip / Sam HIGH — cross-cutting #1):** all data is single-device localStorage with no escape hatch.
**Changes:**
- New `src/utils/dataPort.js` — `exportData()` (serialize profile + inspections + log into a versioned JSON blob; download via Blob/anchor) and `importData(file)` (parse + shape/schema-version validation, return errors).
- UI anchored in `src/screens/ProfileSection.jsx` (a "Data" section with Export / Import buttons + status).
- i18n keys (DE/EN) in `src/i18n/strings.js`.
- Tests for `dataPort.js`.
**Verify:** `test:run`, lint, manual export→import round-trip.

### WS3 — Dead-code removal + `validateSeasons()` (`chore/cleanup-dead-code`)
**Why (Dee #4/#5/#6):** dead exports + missing data validation.
**Changes:**
- Remove `getSeasonWeek` (`src/utils/season.js:20` + its test).
- Remove `getLatestOverall` / `inspectionCount` from `src/hooks/useInspections.js` (after confirming no consumers) + test refs.
- Remove `isWebShareSupported` (`src/utils/share.js:53`).
- Add `src/utils/validateSeasons.js` (mirror `validateDiagnosis`): seasons/tasks/`minExperience`/`unlockAt`/bilingual fields; call dev-only from `useSeason`; add test.
**Verify:** `test:run`, lint, confirm zero references remain.

### WS4 — Rename `.corrupted` test + doc drift + LICENSE (`chore/docs-license-cleanup`)
**Why (Pip):** stale claims, audit-hostile filename, missing LICENSE.
**Changes:**
- `git mv src/screens/DiagnoseScreen.corrupted.test.jsx → DiagnoseScreen.tolerant.test.jsx`.
- Fix README (Vite 8.1.0 not 7; 246/32 tests; LICENSE now present); AGENTS.md / CLAUDE.md (validation at module scope not "on mount"; note the `.js`/`.jsx` context split).
- Add `LICENSE` (MIT) + `"license": "MIT"` in `package.json`.
- Clean duplicate `2.1.0` / `2.1.4` blocks in CHANGELOG.
**Verify:** lint, `test:run`, proof-read.

### WS5 — Build/perf: vendor split + font subsetting/preload (`perf/bundle-and-fonts`)
**Why (Vera P1 / P3):** 80KB entry bundle (React unsplit) + 610KB / 47 font files precached with no `<link rel=preload>` → FOUT.
**Changes:**
- `vite.config.js` — `rollupOptions.output.manualChunks: { react: ['react','react-dom'] }`.
- `src/main.jsx` — import only `latin` subsets per face (`@fontsource/*/latin-*.css`).
- `index.html` — `<link rel="preload" as="font">` for the 2–3 latin faces actually used.
- Trim `workbox.globPatterns` to exclude non-latin subsets if possible.
**Verify:** `npm run build`, inspect chunk sizes + built `index.html`; `test:run`.

### WS6 — Theme-branch consolidation → CSS variables (`refactor/theme-tokens`) **[LARGEST / RISK]**
**Why (Dee #1/#2/#3):** 39 hardcoded hex theme-branches across 12 files duplicate the `--theme-*` variables; plus the ~200-line duplicated Theme-C DiagnoseScreen render tree.
**Changes:**
- Add a token module / `useThemeTokens()` mapping the `--theme-*` variables; replace inline hex triples.
- `src/utils/themeButtonStyle.js` — switch to vars/tokens.
- Refactor `DiagnoseScreen.jsx` Theme-C branch to share the A/B layout where safe.
- Update affected tests.
**Constraints:** must NOT touch `ProfileSection.jsx` data/export sections (owned by WS2/WS7). Run after WS2/WS7.
**Verify:** `test:run`, lint, build, `?theme=a/b/c` visual smoke (screenshots before/after).

### WS7 — Privacy disclosure UI (`feat/privacy-disclosure`)
**Why (Pip MED):** no user-facing statement that data never leaves the device.
**Changes:**
- "About / your data" section anchored in `src/screens/ProfileSection.jsx` — bilingual text: data stored locally on device, never sent to a server, how to delete it, no cloud backup, pointer to Export.
- New i18n keys. Static disclosure — no telemetry.
**Verify:** lint, `test:run`, manual render.

---

## Sequencing & conflict avoidance

Separate branches let agents run in parallel on **disjoint files**:

| File | Owning WS |
|---|---|
| `src/App.jsx`, `src/hooks/useProfile.js` | WS1 |
| `src/utils/dataPort.js` (new), `src/screens/ProfileSection.jsx` (data sect), `strings.js` (data keys) | WS2 |
| `src/utils/season.js`, `src/hooks/useInspections.js`, `src/utils/share.js`, `src/utils/validateSeasons.js` (new) | WS3 |
| `src/screens/DiagnoseScreen.corrupted.test.jsx`, README, AGENTS, CLAUDE, CHANGELOG, `LICENSE`, `package.json` (license) | WS4 |
| `vite.config.js`, `src/main.jsx`, `index.html` | WS5 |
| theme components (12 files) + `utils/themeButtonStyle.js` + `DiagnoseScreen.jsx` | WS6 |
| `src/screens/ProfileSection.jsx` (about sect), `strings.js` (about keys) | WS7 |

**Rules:**
- WS2 and WS7 both touch `ProfileSection.jsx` / `strings.js` → run sequentially against the same section or coordinate; **WS6 must not edit ProfileSection** to avoid conflicts.
- Execution order: foundational low-risk WS1/WS3/WS4 first; WS2 then WS7 (share ProfileSection); WS5; **WS6 last** (largest blast radius, rebases cleanly on top).

---

## Final gate — Code review + QC

After all PRs are on the integration branch (pre-merge):
1. **Code reviewer** — reads the combined diff for correctness, regressions, convention adherence (bilingual strings, Tailwind tokens, co-located tests), and closure of the original findings.
2. **QC / test expert** — runs `npm run test:run`, lint, `npm run build`, `?theme=a/b/c` smoke test; verifies each CTO finding on a checklist is actually closed.

Both return pass/fail with a fixed-finding list; folded into a final remediation + QC report before merge.

---

## Deliverables

- One PR per WS (7 branches off `master`).
- Final "remediation + QC" report: which CTO findings are closed, which remain (content review, telemetry), and the verified quality gates.
