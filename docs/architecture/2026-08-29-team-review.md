# Apiario — Consolidated CTO Review

**Date:** 2026-08-29
**Team:** Ada (CTO) · Mara (Security) · Vera (Performance) · Sam (Product) · Pip (Audit/Readiness) · Dee (Code Health)
**Scope:** Full-stack review of the offline-first React PWA for beginner beekeepers.
**Head:** `4909339` (master, clean tree)

---

## Executive summary

Apiario is an offline-first React PWA for beginner beekeepers: seasonal task guidance, a guided diagnosis wizard, and a per-colony inspection journal — fully bilingual (DE/EN), no backend, static JSON, GitHub Pages. **This is a rare, clean situation: a hobby project that out-executes most funded products.** Architecture is disciplined, the domain content is genuinely authoritative, the test suite is excellent (246 tests / 32 suites, all green), and the dependency diet is minimal (React + fonts + OnboardJS — that's it).

**The thesis:** The hardest problems (architecture, offline, i18n, data integrity) are *already solved*. The remaining work is **validation, distribution, and hardening the edges** — not rebuilding the core.

---

## Scorecard

| Dimension | Score | Review lead |
|---|---|---|
| **Security** | 9.5 / 10 | Mara |
| **Code health / architecture** | 8.5 / 10 | Dee |
| **Product / features** | 7.5 / 10 | Sam |
| **Performance** | 7.5 / 10 | Vera |
| **Docs & audit readiness** | 7.0 / 10 | Pip |
| **Overall readiness** | **8.0 / 10** | **Ada (CTO)** |

---

## What the team found by dimension

### Security — 9.5 (Mara) — genuinely hardened
No realistic exploitable vulnerability found. No backend or network writes to attack; strict same-origin CSP ships in the built bundle (verified in `dist/`); **zero** `dangerouslySetInnerHTML`; all storage parsing is guarded try/catch with schema migration; theme value is whitelist-sanitized against attribute injection; the `?debug` panel is gated out of production (verified absent from bundle). **No secrets anywhere.**

Only two non-blocking recommendations for a perfect score:
1. **Add an `npm audit --audit-level=high` gate to CI** — `deploy.yml:66` uses `--no-audit`, so there's a supply-chain blind spot.
2. **Pin `@onboardjs/core`/`react` past their `-rc` releases** (`package.json:20-21`).

### Code health — 8.5 (Dee) — well-layered, one liability
`App.jsx` (219 lines) is a clean composition root, not a god-component. Clear screen → hooks → utils → data layering. Error handling is the strongest area (every `JSON.parse`, async API, and edge case guarded). **Lint is 0 errors / 0 warnings.** The recent context split (`4909339`) is clean and well-motivated.

Debt to flag:
1. **Theme branching fanned out across 12 files / 39 sites** — inline `#2b1d0e`-style hex triples duplicate the CSS variables that already exist (`--theme-ink`, etc.). This will silently drift. Biggest maintenance win: fold into `var(--theme-*)` tokens (M effort).
2. **Theme C's dark DiagnoseScreen is a fully separate ~200-line render tree** duplicating the A/B layout — any change must be made twice (L effort).
3. **Dead code:** `getSeasonWeek` (`utils/season.js:20`), `getLatestOverall`/`inspectionCount` (`useInspections.js`), `isWebShareSupported` (`utils/share.js:53`) — all safe to delete (S).
4. **No validation exists for `seasons.json`** — only the diagnosis tree is validated. Add a `validateSeasons()` dev check (S).

### Product — 7.5 (Sam) — content-first, but the data should sing
The seasonal task library and diagnosis tree are **authentic expert content**, not AI slop — `why`, `urgency`, `RiskNote`, `callExpert` flags, real varroa/foulbrood/robbing logic. Offline/PWA polish (app badge, wake-lock in the field, relative manifest shortcuts) is exceptional.

**Ranked gaps (value vs effort):**
1. 🔥🔥🔥 **Export/backup** — all data is single-device localStorage. A cleared browser = total silent loss. Lowest-effort, highest trust-killer (LOW effort).
2. 🔥🔥🔥 **Colony health trends/charts** — `useInspections` collects time-series varroa/brood data but nothing renders a trend. "Obvious next feature."
3. 🔥🔥 **Honey harvest tracking**; 4. 🔥🔥 **Treatment history**; 5. 🔥🔥 **Due-date reminders** (content is explicitly date-bound but can't remind you).

**The defining product crack — the single highest-leverage fix:** `climateZone` and `hiveCount` are **dead settings for new users**. Onboarding collects them (`App.jsx:138`), but colony seeding from `hiveCount` only runs in the *legacy v1→v2 migration* — **a fresh user who says "5 hives" lands on an empty hive list.** `climateZone` is read *nowhere* in product logic. `experience` is the only answer that gates anything. Fixing colony seeding is ~zero effort and transforms first-run coherence.

Also: **voice is a navigation remote, not hands-free beekeeping** — it can't navigate to the Inspect tab, "next/repeat" do nothing useful, and it's not discoverable (and Chrome-only, so dead on iOS PWA).

### Performance — 7.5 (Vera) — no jank, but a heavy first load
Lists are 4–7 rows with correct `TaskCard` memoization — **zero runtime interactive jank on a mid-range phone.** The costs are first-load and storage:
1. **No vendor chunk split** — entry bundle is 248KB raw / 80KB gzipped including all of React. `manualChunks: { react: [...] }` = better caching + faster parse (P1).
2. **Fonts: 47 files / 610KB**, all precached (including greek/cyrillic/vietnamese subsets never rendered), and **no `<link rel=preload>`** → FOUT on first paint. Import only `latin` subsets + drop non-latin from the SW precache (P3).

### Docs & audit readiness — 7.0 (Pip) — strong tests, stale claims
246/32 tests all passing, no skips/pending. Release process is disciplined. But:
- **HIGH: No export/backup/import path** (echoes Sam — this is the #1 cross-cutting finding).
- **MED-HIGH: No LICENSE file** though README claims MIT, on a public repo.
- **MED: Doc drift** — README says Vite 7 (installed 8.1.0), "231 tests" (actual 246), AGENTS/CLAUDE say `validateDiagnosisTree()` runs "on mount" but it's now at module scope (`DiagnoseScreen.jsx:14`); `CONTEXT.md`/`docs/adr/` are referenced but don't exist.
- **MED: Changelog** has 2.1.0 and 2.1.4 duplicated blocks; `TODOS.md` abandoned since May.
- **Note:** `DiagnoseScreen.corrupted.test.jsx` is *not* corrupt — it's a legitimate resilience test. But the name is audit-hostile; rename it (e.g. `DiagnoseScreen.tolerant.test.jsx`) next touch.
- **Untested:** the entire `App.jsx` shell (biggest gap), `main.jsx`, `ErrorBoundary`, `DebugPanel`, `SeasonScreen`/`SeasonHeader`, `VoiceOverlay`.

---

## CTO's judgment calls (where the team got it right / wrong)

**Under-weighted:** The team over-rotated on **polish and breadth** (three full themes, voice, view transitions, badges) relative to **validation signal**. Ruthless CTO truth: *we built a beautiful product for a user we've never measured.* Export and a feedback loop should have shipped before the second theme.

**Over-weighted → actually a strength:** the test suite is excellent — but the marginal testing dollar will soon return less than content-validation and telemetry dollars.

**Called out as correct:** tight scope, zero backend debt, honest README, disciplined dependency diet, schema-versioned storage with cascading deletes, and `callExpert` guardrails baked into the diagnosis data model.

---

## Prioritized CTO roadmap (stabilize → harden → grow)

**Phase 1 — Stabilize (wk 1–4)**
1. External beekeeper-expert review of every diagnosis outcome + seasonal task (the entire trust surface — a wrong call can cost a hive).
2. **Seed `colonies[]` at onboarding from `hiveCount`** (near-zero effort, fixes the worst first-run bug).
3. **Export/backup** (JSON export + import) — the #1 data-durability escape hatch.
4. Add `npm audit` gate to CI.

**Phase 2 — Harden (wk 5–8)**
5. Opt-in offline-deferred, privacy-first telemetry to learn real diagnosis dead-ends and drop-off.
6. Bundle split (React vendor chunk) + latin-only font subsetting/preload.
7. Fold the 39 theme branches into CSS variables; delete dead code; add `validateSeasons()`.
8. Add `LICENSE`, privacy/data-lifecycle disclosure, refresh stale docs.

**Phase 3 — Grow (wk 9–12)**
9. Use telemetry to pick the one high-value expansion (health dashboards vs. diagnostic depth vs. cross-season planning).
10. Open the diagnosis tree as an editable asset + content-contribution guide.

---

## Files to look at first
- `src/App.jsx:138` — onboarding doesn't seed colonies from `hiveCount`
- `src/hooks/useProfile.js:47-59` — colony seeding only in legacy migration
- `src/utils/themeButtonStyle.js`, `InspectionCard.jsx:35` — hardcoded hex vs CSS vars
- `src/screens/DiagnoseScreen.jsx:57-270` — duplicated Theme-C render tree
- `src/screens/DiagnoseScreen.corrupted.test.jsx` — rename it
- `.github/workflows/deploy.yml:66` — add `npm audit` gate

---

## Bottom line (Ada)

**8/10** — technically ready to ship and maintain today; clean, tested, offline-correct. But not yet *proven*. The gap between "a great build" and "a trusted product for a niche audience" is **expert content validation and a usage feedback loop**, not more code. This is one honest season of real-user telemetry away from a 9.5.
