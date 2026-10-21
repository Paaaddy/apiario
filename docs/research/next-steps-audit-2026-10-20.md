# Apiario — Next Steps Audit

**Date:** 2026-10-20 · **Commit audited:** `479fe82` (master, v2.7.1) · **Method:** 7 parallel specialist audits + orchestrator verification

---

## 0. How this was produced

Seven independent specialists audited the repository in parallel, each writing a full report:

| Voice | Report | Focus |
|---|---|---|
| UX/UI | `/tmp/opencode/apiario-audit/ux-ui.md` | Outdoor, one-handed, beginner-first usability |
| Performance | `/tmp/opencode/apiario-audit/performance.md` | Bundle, precache, render cost, storage |
| Quality | `/tmp/opencode/apiario-audit/quality.md` | Tests, coverage, standards, seams |
| Product | `/tmp/opencode/apiario-audit/product.md` | What to build, what to kill, ROI |
| ESP32 / Hardware | `/tmp/opencode/apiario-audit/esp32.md` | Sensors, connectivity, physics, cost |
| Security | `/tmp/opencode/apiario-audit/security.md` | Threat model, import path, supply chain |
| CTO | `/tmp/opencode/apiario-audit/cto.md` | Architecture, delivery health, roadmap |

The orchestrator then independently re-verified the load-bearing claims against source and build output. **Everything marked ✅ below was re-confirmed by direct inspection, not taken on trust.**

---

## 1. Verdict

**Keep building Apiario — but stop adding features and pay down the defects first.**

The single most important finding in this audit is a paradox:

> Apiario has **629 passing tests, 0 lint errors, a clean `npm run verify`, three themes, a bilingual string system and an enforced i18n lint rule** — and it **ships 8 missing translation keys that render blank buttons and drop bee-welfare warnings in two of three themes.**

The project has a *green* process and a *broken* product. Everything else in this report is downstream of that.

Three concrete numbers to hold onto:

- **8** missing i18n keys, live in `dist/` — the inspection form shows a blank "Temperament" label above **three empty buttons**
- **30 of 48** seasonal tasks carry a bee-protection warning that **themes B and C never render**
- **896.47 KiB** of service-worker precache, of which **109 KB** is a wizard library used once on day one

**Priority order, in one line:** *fix what's broken (2 days) → fix what a beginner can't read (2 weeks) → shrink and speed the app (2 days) → then build the product bet.*

---

## 2. What is open right now

| Item | State | Action |
|---|---|---|
| 4 Dependabot PRs (#152–#155) | open, waiting on a human | Merge after the auto-merge fix (§7.3) |
| `deepen/colony-record-seam` | **0 commits ahead of master** (1 behind) | Merged — delete the branch |
| `deepen/navigation-handoff-seam` | **0 commits ahead of master** | Merged — delete the branch |
| `npm run verify` | exit 0 — lint 0 · 62 files / 629 tests · Berlin + LA chronology 17/17 · build OK | Green, but see §3 |
| Velocity (8 weeks) | 75 commits · **56 refactor/chore/fix vs 7 feat** | Refactor has become the default activity |
| Coverage tooling | **not installed** (`coverage-v8` absent) | No % — file-level reasoning only |

---

## 3. The five confirmed critical defects

All five were re-verified by the orchestrator against source and the production build.

### 3.1 ✅ Eight missing translation keys render blank UI in the inspection form

```
USED but NOT DEFINED in strings.js:
  insp_notes_label         → InspectionCard.jsx, InspectionForm.jsx
  insp_notes_placeholder   → InspectionForm.jsx
  insp_stores_label        → InspectionForm.jsx
  insp_temperament_label   → InspectionCard.jsx, InspectionForm.jsx
  insp_temperament_calm    → InspectionForm.jsx
  insp_temperament_normal  → InspectionForm.jsx
  insp_temperament_defensive → InspectionForm.jsx
  insp_varroa_not_tested   → InspectionCard.jsx, InspectionForm.jsx
  insp_treatment_placeholder → InspectionForm.jsx
```

`strings.js:256` defines `insp_honeystores_label` ("Honigvorräte" / "Honey stores") — the form asks for `insp_stores_label`. **Rename drift, not a typo.**

The failure chain is mechanical: `t(undefined)` → `LanguageContext.jsx:25` `if (value == null) return ''` → **empty string rendered as a label.**

**Live user impact:** the inspection form — the app's core journal, the thing a beekeeper opens standing in a field — shows a blank "Temperament" label over **three unlabelled buttons**, a blank "Honey stores" label over a 1–5 scale, a blank "Notes" label, and a blank "Varroa not tested" option. Confirmed present in the shipped bundle (`dist/assets/InspectionTab-Dvot8qU-.js`).

> **UX voice:** *"My German beekeeper opens the inspection form and the Temperament field is three blank buttons. Three. Blank. Buttons. Nobody noticed, because our linter only asks 'is this text hardcoded?' — it never asks 'does this key exist?' We policed the wrong half of the problem."*

**Fix:** add/rename the 8 keys (30 min) **and** add an `i18n/no-missing-string-key` lint rule (3 h). The rule is the actual fix; the keys are the symptom.

### 3.2 ✅ Bee-welfare warnings are silently dropped in themes B and C

`TaskCard.jsx` has three independent theme branches — theme B at line 23, theme C at line 73, theme A at line 106. `<RiskNote risk={task.risk} />` appears **exactly once, at line 153 — inside the theme-A branch only.**

Live DOM count: **A = 6 warnings rendered, B = 0, C = 0.**

> **UX voice:** *"Thirty of my forty-eight seasonal tasks warn that this treatment could hurt the bees. In two of my three themes that warning does not exist. Not greyed out. Not collapsed. Not rendered. I am not shipping a theme that quietly deletes the bee-protection advice — that's a safety decision that happened because one branch was copy-pasted and nobody checked the bottom of the file."*

This is a **product-safety defect**, not a cosmetic one: a treatment warning tells the beekeeper this action can kill bees. Two thirds of your theme users never see it.

**Fix:** 30 minutes. Render `<RiskNote>` in the B and C branches.

### 3.3 ✅ The diagnosis result ignores the theme — invisible heading

`DiagnosisResult.jsx` hardcodes `text-brown` / `text-brown-mid` Tailwind classes (lines 49, 52, 64, 71, 80, 87) and never reads the theme. On theme C (`#1c1410` background) the `#3d1f00` heading is a **1.21:1 contrast ratio** — the "Was tun" heading is effectively invisible.

**Fix:** 1 hour. The same class of bug as §3.2 — copy-pasted branches that drift.

### 3.4 ✅ The auto-merge workflow has never merged anything

`.github/workflows/dependabot-automerge.yml:69` gates on `steps.pr.outputs.author == 'dependabot[bot]'`. The real GitHub App login is **`app/dependabot`** — confirmed against every merged PR:

```
149 | app/dependabot | fix(deps-dev): bump the testing group …
143 | app/dependabot | fix(deps): bump actions/upload-artifact …
142 | app/dependabot | fix(deps): bump actions/download-artifact …
```

Line 97's commit-author check (`dependabot[bot]`) is the correct form — which is why the bug hides: **the commit check passes and the PR check silently fails.** Every bump is merged by hand. There are **4 open PRs** and a 24-release pace in 8 weeks of manual work.

> **CTO voice:** *"My auto-merge workflow has never merged a single pull request. Not one. It checks for `dependabot[bot]`; my Dependabot signs in as `app/dependabot`."*

**Fix:** 30 minutes (change the login string) + add the PAT token so it can actually merge + put a human gate on **production** dependency bumps.

### 3.5 ✅ Inspection records have no schema version — a one-way door

`durableStorage.js` versions the **profile** (`PROFILE_SCHEMA_VERSION = 3`, line 1) and the **backup envelope** (`SCHEMA_VERSION = 2`, line 244). But `useInspections.js` loads `apiario-inspections` through `isInspection` — **type checks only, no version, no migrate hook.**

`durableStorage.js:318` rejects any backup whose `schemaVersion` is not `1` or `2`. So when the inspection record shape changes:

- The new app writes backups the **old app refuses to import**
- Stored inspections have **no migration path** — only a type check that tolerates the missing field

> **CTO voice:** *"My users' inspection journals have no schema version. You don't need to be an expert to see that's the one change in this repo that can silently take somebody's season of observations away."*

**Fix:** 2 days. Version the inspection and task-log record shapes alongside the profile; add a migrate hook on load.

---

## 4. The seven voices

### 4.1 UX/UI — the beginner in the field

**Score: the design system is one-third applied.** Three disagreeing colour systems (`index.css` `@theme`, `--theme-*` variables, `themeTokens.js`); 6 screens hardcode theme-A Tailwind and ignore `useTheme()`.

Top findings (39 total, 512-line report):

| ID | Sev | Finding |
|---|---|---|
| UX-01/04 | Critical | 8 missing i18n keys → blank labels, 3 blank temperament buttons (§3.1) |
| UX-02 | Critical | `RiskNote` missing in themes B/C — 30 bee-safety warnings dropped (§3.2) |
| UX-03 | Critical | `DiagnosisResult` ignores theme — 1.21:1 contrast, invisible heading (§3.3) |
| UX-07/06 | High | 3 colour systems, 6 theme-blind screens, a theme-A fallback baked into `ProfileSection` |
| UX-08 | High | The floating PWA install card covers **73% of the voice button's hit area** (2290 px² overlap), in all 3 themes, and is **not persisted as dismissed** |
| UX-09 | High | Deleting a colony deletes **all its inspections** behind one `window.confirm("Really remove this colony?")` — no data-loss warning, no undo |
| UX-10/12 | High | Task checkbox is 18×18 px — **4–6× below the 44 px** touch target minimum. The diagnosis wizard has **no back button** and loses all state on tab switch or reload (verified: 2 questions answered → back at step 1) |
| UX-11 | Med | Progress denominator is the deepest branch, not your path — "02/04" then the outcome |
| UX-17 | Med | DE/EN toggle ~1.1:1 in theme C — invisible where the user wants it |
| UX-22 | Med | The i18n ESLint rule **misses** hardcoded English in expression position (`aria-label` in a ternary) — probe-verified |
| UX-28 | Med | Voice commands `weiter` / `nochmal` are spoken to the user ("Weiter." / "Wiederhole.") and **do nothing** |
| UX-20 | Med | **23 dead string keys** — including all 14 semantic scale labels |
| UX-26 | Med | German expansion measured at **1.16×** (median 1.21×), not the folklore "30%" — but with a 4.0× tail ('Keine Behandlung' vs 'None') |

> *"I built this for a beekeeper standing in a sunny field with one hand on a frame and the other in a glove. And I shipped a task checkbox that's eighteen pixels wide. That's not a tap target, that's a rounding error."*

> *"A theme should mean one place I change a colour and everything follows. Right now I have three systems that disagree, and six screens still wearing the Honeycomb outfit in a Seasonal Light world."*

**Top 5 UX wins by user impact per hour:**
1. Add the 8 keys + `i18n/no-missing-string-key` rule — **2 h**
2. Render `<RiskNote>` in themes B/C — **30 min**
3. Honour the theme in `DiagnosisResult` — **1 h**
4. 44 px touch targets + resolve the install-card / voice-button overlap — **2.5 h**
5. Replace the numeric 1–5 scales with the labels already sitting in `strings.js` — **3 h**

### 4.2 Performance — measured, not guessed

**Measured numbers:**

| Metric | Value | How measured |
|---|---|---|
| `dist/` total | 1,215,047 B | `du -sb dist` |
| **Service-worker precache** | **919,139 B (897.6 KiB), 33 entries** | parsed from `dist/sw.js` |
| Onboarding chunk | **118,884 B / 29,390 B gz** | build output |
| React chunk | 218,759 B / 68,260 B gz | build output |
| Main chunk | 118,033 B / 41,340 B gz | build output |
| `orderInspections(500)` | **13.23 ms → 1.53 ms** parse-once | Node 22, 40 iters, `hrtime` |
| `colonyChronology(2500)` + `buildColonyRecords` + `buildNextActions` | **64.3 + 108.4 + 64.3 = ~237 ms main-thread** | same |
| `SeasonScreen` re-render | 71.1 ms @ 2,500 inspections (10.3 ms @ 0) | jsdom + React 19 `act()` |
| `localStorage` read / write @ 2,500 | 4.75 ms / 3.29 ms | jsdom, real payload |
| Worst-case storage | **4,656.8 KiB vs Chrome's ~5 MiB quota** | computed |
| CLS | **0** — not one `<img>` in `src/` | `grep` |

**Top findings:**

| ID | Finding | Impact |
|---|---|---|
| PERF-01 | `@onboardjs/core+react` ≈ 92% of the 118,884 B Onboarding chunk. A 40-line local state machine replaces it | **−109 KB, −11.9% of precache** — and it is the *first screen every new user sees* |
| PERF-05 | Inspection chronology runs **4× per save** | **~237 ms frozen tap** ≈ 0.6–1.2 s on mid-range Android |
| PERF-02 | `SeasonScreen → nextActions → diagnosisFlow → diagnosis.json` is static — the landing tab ships the 46 KB diagnosis tree | **−39,892 B raw / −14,273 B gz** off the default critical path |
| PERF-04 | `orderInspections` re-parses the date string inside every comparator | **8.6× speedup** (root cause of PERF-05) |
| PERF-03 | 486.6 KiB of fonts, 20 files, 4 families; 10 `.woff` fallbacks never fetched; **Playfair 900 is dead** | **−58 KB precache** + **−278 KB dead weight** |
| PERF-06 | `index.html` preloads Playfair **600**, but the first paint needs **700** | 23 KB second round-trip + FOU |
| PERF-08 | Global **non-passive `touchmove`** listener (`src/main.jsx:18`) blocks the compositor on every scroll, on every screen | Scroll jank app-wide |
| PERF-13/14 | `localStorage` read + parse happens **inside the first render**; write + stringify in the tap handler | 4.75 ms / 19.85 ms @ 10,000 records |

**Combined fix ceiling: precache 919,139 → ~753,000 B (−18%)**, verified as real variant builds.

> *"I've shipped apps smaller than this that still felt broken. The tell isn't the bundle size, it's the 237 milliseconds where the screen stops responding while it re-sorts a date string. Fix the hot function first, the bytes second. Bytes are a one-time cost; a frozen tap is every single time."*

> *"The `touchmove` listener with `passive: false` is the most common cause of 'this app scrolls badly' I see in audits, and it's always four lines someone copied from Stack Overflow to stop a pinch-zoom. `touch-action` already does that."*

### 4.3 Quality — green is not the same as right

**Measured:** 629 tests / 0 failed / 0 pending across 62 files (174.8 s) · lint **exit 0, 0 errors, 0 warnings** · timezone matrix exit 0 · **coverage provider not installed** · **33 of 83 source files (40%) have no co-located test** · 0 assertion-free tests · 0 snapshots · strings.js de/en parity 252/252.

**Top findings:**

1. **[High] The i18n rule has 4 blind spots** — `eslint-rules/no-hardcoded-ui-text.js:78-92` only sees `JSXText`, literal containers and literal attributes. Proven with `npx eslint --stdin`: **0 reports** for `ConditionalExpression`, `TemplateLiteral`, or logical `&&`. Live violations: `TaskCard.jsx:31,80,115` ('Uncheck task'), `InspectionCard.jsx:51` ('collapse'), `SeasonScreen.jsx:278` ('end of week') — English text in a German-default app.
2. **[High] `durableStorage.js` (375 LOC) has no test file of its own.** `migrateProfile` has **zero direct test hits**; its tests live under `dataPort.test.js`.
3. **[High] Themes B and C are unrendered.** `DiagnoseScreen.test.jsx` has no `ThemeProvider` → the default context silently gives theme A → **the theme-B/C branches at `DiagnoseScreen.jsx:51-197` never mount.** 18 of 31 `.test.jsx` files lack `ThemeProvider`. *This is precisely why §3.2 and §3.3 shipped.*
4. **[High] `useDiagnosisFlow.js:12-16`** — the colony-scoped warning branch (the point of the newest seam) has **no unit test**; the test file never passes `nextAction`.
5. **[Med-High] `no-undef` is off for `src/`** — `eslint.config.js:20-33` applies `js.configs.recommended` only to `scripts/`. Probe: an undefined identifier exits 0.
6. **[Med-High] Two colour systems** — `themeTokens.test.js:31-59` claims to "mirror the CSS palette" but hardcodes both sides and **never reads `index.css`**. A test that cannot fail is worse than no test.
7. **[Med] `app-reference.md` drift ×5** — "three tab screens" vs 5; Inspection shape 8 fields vs 13; "56 entries/~1074 KB" vs the real **30 / 750.88 KiB**; `themeTokens.js` + `LearnScreen` undocumented; `docs/adr/` referenced but absent.
8. **[Med] `useColonyRemoval`** — the coordinated two-phase durable delete — has exactly **one** test, covering only the rollback-failure path.

**Untested files, top 15 by risk:** `durableStorage.js` 375 · `strings.js` 377 · `inspectionHistory.js` 226 · `LogSection.jsx` 158 · `DebugPanel.jsx` 150 · `InspectionCard.jsx` 136 · `MyHiveTabStrip.jsx` 118 · `SeasonHeader.jsx` 79 · `usePwaInstallPrompt.js` 68 · `PwaInstallHint.jsx` 64 · `ErrorBoundary.jsx` 62 · `VoiceOverlay.jsx` 57 · `InspectionScaleInput.jsx` 45 · `reloadSafety.js` 49 · `LanguageContext.jsx` 38

> *"The most dangerous file isn't `Onboarding.jsx` at 380 lines. It's `durableStorage.js` at 375, because nobody can find its tests — they're called `dataPort.test.js`. The migration function has never been called directly in its life. Ask 'if this file were deleted, which test would go red?' Answer: none, by name. That question is free."*

> *"Six hundred twenty-nine tests, zero failures, and the one rule meant to make the bilingual contract mechanical was looking at literal strings only. Green is not the same as right. I check the blind spots in my rules before I trust my suite."*

> *"Two thirds of your UI is unrendered. The Diagnose screen's dark theme has never been painted in a test. One wrong Tailwind class and the whole app looks like theme A for that user — and your suite stays bright green while you ship it."*

### 4.4 Product — the bet

**The single biggest bet:** *make Apiario calendar-driven and threshold-aware instead of a seasonal-checklist reader.*

Three parts:
1. Give every seasonal task a **date window + repeat cadence**
2. Apply the **varroa thresholds the app already knows** (3 mites/100 bees May–Oct, **1/100 in February**) to the number users already type, and turn a treatment into a tracked object with a "recount due" date
3. Fire **one** local notification

**Why:** the content is expert-grade and source-verified; the *product logic* is the gap.
- `useSeason.js:87-91` returns the whole season's tasks for every week — **13 identical cards × 12 weeks**
- `useTaskLog.js:31-46` makes completion permanent — a swarm check ticked in April is gone forever
- **Zero notification code in `src/`**
- The badge (`App.jsx:60-68`) counts the **season**, not the week, and only counts down — *"Give me a badge that only counts down and I'll open it once a season."*
- `routeFromInspection` uses a flat `varroa >= 3` — **3× too lax in February**

**Ranked what to build next:**

1. **Label the 1–5 inspection scales** — 14 descriptor keys already sit unused in `strings.js`
2. **Seasonal varroa threshold engine** (research fact F1 is already written and cited)
3. **Structured treatment record** — 5 unused `insp_treatment_*` keys prove the taxonomy was designed
4. **Task date windows + repeat cadence** (needs date-stamped completions, not a boolean `Set`)
5. **One local notification** for the next action
6. **Ship the research backlog into Learn** — 31 researched facts in `docs/research/beekeeping-facts.md`, only 11 in `knowledge.json`
7. **In-app "Send feedback" + local stats export** — 0 stars, 0 user issues, 0 analytics: the cheapest possible research loop
8. **Donations link** (4 h)

**Monetization verdict:** *do not build a business into the app.* Realistic ceiling **€0–1,500/yr**, mostly from 1–2 association relationships (DE Imkerverein), not app sales. Only credible lines: a donations link (now), a printable **Kontrollblatt / season-planner export** (lead magnet → later €2–9), and association B2B packs. **Rejected:** paywall, subscription, ads, sponsors, marketplace, paid course, telemetry-as-product. ROI here must be measured in *users-helped per maintainer-hour*, not euros — with 0 stars, **recruitment is the bottleneck, not monetization.**

> *"The seasonal checklist is the good part and I will not touch it. What I need is for it to come back… Give me a badge that only counts down and I'll open it once a season."*

> *"We have thirty-one researched facts in `beekeeping-facts.md` and eleven in `knowledge.json`. The cheapest possible improvement to this product is copying our own research file into our own JSON. Nobody is asking for a backend."*

> *"Don't build sync. Build a mirror. One opt-in toggle, my own passphrase, my own bucket, off by default — the privacy story survives intact."*

> *"Zero stars, zero user issues, zero analytics. We are tuning a funnel nobody can see. Ship the rhythm first, measure second, and never put a paywall in front of a beginner who just lost a colony."*

### 4.5 ESP32 / Hardware — the honest answer

**Verdict:** *hardware is not worth it as a product purchase for a beginner in Apiario's current form.* The one sensor worth building is a **rain-shielded hive scale + brood thermometer**, as a **self-build**, not a product. The architecture that fits no-backend/offline-first/no-accounts is **BLE direct-read at inspection time** — no Worker, no Durable Object, no cloud.

**The repo finding that changes the arithmetic:** the app uses **localStorage only — no IndexedDB** (the brief assumed otherwise). ~5 MB ceiling ⇒ raw time series impossible ⇒ **the device must aggregate to daily records on-device.**

| Sensor | What it measures | Why a beginner cares | BOM | Verdict |
|---|---|---|---|---|
| **Hive weight** (load cell + HX711) | weight change → nectar flow, robbing, starvation | "Did they eat my honey?" — the #1 winter fear; the app already prints a 15–20 kg target | €35–60 | **Ship (self-build)** |
| **Brood-box temp** (DS18B20/SHT31) | 34–35 °C healthy; <32 °C chilled | brood survival | €6–10 marginal | Phase 1 pilot |
| Ambient T/RH at entrance | flight activity | weak — Open-Meteo covers 90% | bundle free | don't sell it |
| **Varroa** | — | 0.6 mm mite, sealed in wax. MLX90640 is 1.6 mm/pixel. **No cheap sensor exists.** | — | **Skip permanently** |
| Acoustic / vibration / camera | piping, swarming, disturbance | ML on device, in the rain, for a beginner | — | **Skip** |

**Recommended architecture — BLE (Web Bluetooth), read at inspection time:**
ESP32-C3 deep-sleep, samples every 15 min, radio silent unless the phone asks (only budget that survives a northern January). GATT service `apiario-sensor-v1` exposes `meta`/`current`/`log`/`ack`; the app upserts daily aggregates **idempotently** into a new `apiario-readings` slice and the point value into the open Inspection. **Nothing leaves the device.** iOS fallback: device SoftAP page → signed deep link `?import=…` → confirmation sheet.

**The no-hardware "wow" features — Phase 0, €0, and they capture most of the retention effect:**

1. **Manual `weightKg` + 7-day delta + seasonal anomaly** (S) — the same information a €60 scale gives you; sparkline machinery already exists
2. **Varroa wash log with sample size** (`varroaMites` + `varroaBees`) → derived mites/100 bees → season threshold (3 May–Oct / 1 Feb, already researched) → trend alert — attacks the **#1 killer of beginner colonies** with the phone camera the user already owns
3. **Apiary GPS + cached Open-Meteo + sunrise/sunset** (M) → inspection-condition gate (12–15 °C min)

**The gate:** *manual weight entry is the test.* If users don't enter a second weight in 8 weeks, don't build the board.

> *"I have built four hive scales. Three of them turned out to be rain gauges in disguise. Ten millimetres of rain on a half-square-metre lid is five kilos."*

> *"Nobody, in twenty years, has made a thirty-euro varroa sensor… the right sensor is the phone camera and an alcohol wash, and you are already carrying both."*

> *"A WiFi hive scale in January is a corpse. An 18650 will not charge at minus five."*

> *"The cheapest thing in this entire audit is a number field. 'Weight in kilograms' next to the fifteen-to-twenty-kilo target the app already prints."*

> *"Support for hardware is not support for software. A scale in the rain in February is a ticket I cannot reproduce, for a board I cannot see, for a beginner whose bees I will never meet."*

### 4.6 Security — moderate, with one sharp edge

**Overall verdict: MODERATE.** No remotely exploitable vulnerability. Risk lives in the import path and the CI supply chain.

**Verified clean (tested, not assumed):** **zero network calls in `src/`** · zero `dangerouslySetInnerHTML` / `innerHTML` / `eval` · **no prototype pollution** on import (all merges use spread → `CreateDataProperty`; the real module was run with `__proto__` payloads, `Object.prototype` untouched) · no secrets in tree or history · the debug panel is absent from `dist/` · **`npm audit` → 0 vulnerabilities**, `npm audit --omit=dev` → 0.

| Sev | Finding | Evidence |
|---|---|---|
| **High** | Prod-dependency patch/minor bumps auto-merge to `master`; `dependency-type` is parsed but never gates the merge | `dependabot-automerge.yml:149-158` |
| **High** | 7 GH Actions pinned to **mutable tags**; `cloudflare/wrangler-action@v4` holds the Cloudflare token | `deploy.yml:23,26,34,46,75,118,161` |
| **Med-High** | A 152-byte backup manufactures **10,000 colonies**; `migrateProfile` **discards the file's own colonies** (`buildSeededColonies` called without `existing`) | `durableStorage.js:39,16-33,101`; `backupLimits.js:4` |
| **Med** | Import bounds neither colony count (20 k accepted) nor field length (4 MiB name accepted); the UI caps at 100/300 | `durableStorage.js:91-105` vs `ColoniesSection.jsx:99,107` |
| **Med** | **No `public/_headers`** → Cloudflare serves **no HTTP security headers**; a meta CSP can't express `frame-ancestors` | `public/` = 2 PNGs; `index.html:5-6` |
| **Med** | SW force-activates bad builds, no rollback; `workbox.skipWaiting=false` is **silently overridden** by the plugin | `vite.config.js:9`; `vite-plugin-pwa/dist/index.js:874-877` |
| **Med** | *"No data is ever sent to a server"* vs. hands-free streaming mic audio to Google/Apple | `strings.js:121` vs `useVoice.js:46-73` |
| **Med** | Export = plaintext, un-redacted, un-warned → lands in a cloud-synced Downloads folder | `useDataPort.js:5-18` |

**Recommended `public/_headers`:**
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), geolocation=(), microphone=(self), payment=(), usb=(), serial=(), bluetooth=()
  Cross-Origin-Opener-Policy: same-origin
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=63072000; includeSubDomains
```
`style-src 'unsafe-inline'` must stay (inline `style={{}}` is used throughout). Keep the meta tag as the GitHub Pages fallback, minus `frame-ancestors`.

> *"The import path is the whole attack surface — 'validated' is not 'bounded.' A 152-byte file manufactured ten thousand colonies and threw away the ones the file actually carried. Shape checks are not size checks."*

> *"A backup file is untrusted input wearing a `.json` extension. It arrives by email, forum, USB. Count, length, bytes — not just types."*

> *"I found no XSS sink and I looked hard. React escapes everything. That's why your risk profile differs from a normal web app's — so the import path is where your remaining risk lives."*

> *"The scary part isn't the app, it's the pipeline. You auto-merge prod dependency patches with nobody looking and run a mutable action tag holding your Cloudflare token. SHA-pin and put a human between npm and `master`."*

> *"One file fixes a whole class: `public/_headers`. A `<meta>` tag can't say `frame-ancestors` — you're frameable and shipping no `nosniff`/`Referrer-Policy`/`Permissions-Policy`."*

### 4.7 CTO — the engineering strategy

**Verdict: keep investing, but change what you buy.** The code is in far better shape than the process around it. The seam-deepening is **converging** (handoff seam 9/10, colony-record 8/10) but has become the dominant activity: **11 refactor vs 5 feat** since 2026-08-30. *It's two days of work, not another quarter.*

**Scorecard:**

| Dimension | /10 | Justification |
|---|---|---|
| Architecture | 6.5 | sound modules, shallow seams still duck-typed |
| Tests | 8 | 629 green, but blind spots in the rules themselves |
| Delivery | 7 | `verify` green, releases frequent, PR discipline real |
| **Docs** | **5** | the map of the code is lying (Tailwind 3 vs 4, precache numbers, screen count) |
| Dependencies | 6 | 4 font families, 2 rc-version deps, one unused wizard lib |
| **Automation** | **4** | the auto-merge gate has never fired; a weekly bot files 6 issues and closes 6 |

**Top 3 landmines:**

1. **No schema version on inspections or task logs** (§3.5) — one-way door
2. **Zero tests for the offline contract** — `grep -rn "serviceWorker\|workbox\|precache\|offline" src --include="*.test.*"` → **0 matches.** Break the precache and all 629 tests stay green. *Docs claim "56 entries/~1074 KB"; the build says **33 entries / 896.47 KiB**.*
3. **The Dependabot auto-merge has never merged anything** (§3.4)

**90-day roadmap (CTO's own, ~22 days of work):**
① version the inspection/log schemas (2 d) ② fix the auto-merge login + PAT (0.5 d) ③ offline-contract test (1.5 d) ④ `pool:'vmThreads'` — jsdom is 49% of the 171.84 s suite (1 d) ⑤ finish the colony-record migration — `InspectionTab.jsx:38` still duplicates `groupByColony` (2 d) ⑥ ship one spec'd feature (5 d)

**STOP** — "deepen the module" PRs with no outcome · release-please bumps on dep-only changes (24 tags in 8 weeks) · the Thursday bot issue (6 filed, 6 closed, 0 real issues) · docs describing a system that doesn't exist (Tailwind 3, 56 entries, `docs/adr/` absent, `claude-reference.md` contradicting `app-reference.md:38`)
**START** — version the inspection schema · test the offline contract · spec issues before features · a backup-export nudge · coverage tooling
**KEEP** — the `useStoredState` contract (one validator set across load/write/import) · the `i18n/no-hardcoded-ui-text` rule (1 escape hatch in 14.4 k LOC) · the timezone matrix · the credential-isolated deploy split · `reloadSafety` · DE-first bilingual

> *"My users' inspection journals have no schema version. You don't need to be an expert to see that's the one change in this repo that can silently take somebody's season of observations away."*

> *"Six hundred and twenty-nine tests, and not one of them asks whether the app works with the network off. That is the product."*

> *"My README says Tailwind 3. My package.json says Tailwind 4. The code is fine — the map of the code is lying."*

> *"I can merge forty Dependabot PRs a month. What I can't do is spend three hours a week proving the app still works offline in a browser I never open."*

---

## 5. Where the voices disagree — and who is right

| Disagreement | Positions | Resolution |
|---|---|---|
| **Is hardware worth building?** | ESP32: "the only sensor worth building is a hive scale, as a self-build" · Product: "hardware is a distraction; ship the rhythm first" | **Both right, at different scopes.** Ship the *no-hardware* weight + varroa features now (they are the same data, typed). Build a board only if users enter a second weight within 8 weeks. The gate is the product. |
| **Is the refactor campaign done?** | CTO: "converging, 2 days not a quarter" · Quality: "the newest seam is untested" | **CTO is right on scope, Quality is right on order.** Finish the colony-record migration (2 d), *then* land its tests, *then* stop refactoring. |
| **Monetize now?** | Product: "don't build a business in; realistic ceiling €0–1,500/yr" | **Product is right.** Donations link (4 h) + a printable Kontrollblatt. Recruitment is the bottleneck, not monetization. |
| **Performance vs UX first?** | Performance: "237 ms frozen tap" · UX: "three blank buttons" | **UX wins on urgency** (broken vs slow), but the performance hot path *is* a UX defect. Interleave: the 44 px targets and the memoization land in the same files. |
| **Is the app secure?** | Security: "moderate, import path is the edge" · CTO: "the pipeline is the scary part" | **Agree.** The app code is clean; the import path and the CI pipeline are the real exposure. Both are ≤1 day to fix. |

---

## 6. The roadmap — ROI-ranked

Effort is **solo-maintainer days**. ROI is scored as *user harm removed or value created per maintainer-hour*, because with 0 stars and 0 user issues, this project cannot be optimised for revenue.

### Track A — Ship-blocking defects (2 days, do first)

| # | Item | Effort | Why now |
|---|---|---|---|
| A1 | Add/rename the **8 missing i18n keys** | 0.5 d | Blank buttons and blank labels in the core journal, in production |
| A2 | Add **`i18n/no-missing-string-key`** lint rule | 0.5 d | Makes A1 impossible to regress — the real fix |
| A3 | Render **`<RiskNote>` in themes B and C** | 0.5 h | 30 bee-welfare warnings deleted for 2/3 of users |
| A4 | Honour the theme in **`DiagnosisResult`** | 1 h | 1.21:1 contrast — invisible heading |
| A5 | Fix the **Dependabot auto-merge login** (`app/dependabot`) + PAT | 0.5 d | 4 open PRs; unblocks ~5 PRs/month of manual work |
| A6 | Delete the two **merged branches** | 5 min | Hygiene |

### Track B — The beginner can actually use it (2 weeks)

| # | Item | Effort | User value |
|---|---|---|---|
| B1 | Wire the **14 dormant scale descriptors** into `InspectionScaleInput` — replace bare 1–5 with "solid / patchy / scattered / none" | 3 h | **Highest perceived-quality-per-hour in the app.** Turns "1 2 3 4 5" into meaning |
| B2 | Wire the **5 dormant treatment labels** + `insp_colony_placeholder` | 2 h | Same |
| B3 | **44 px touch targets** (task checkbox is 18 px) | 2.5 h | Gloves, sun, one hand |
| B4 | **Resolve the install-card / voice-button overlap** (73% overlap) + persist the dismissal | 2 h | The voice button is the hands-free feature's only entry point |
| B5 | **Diagnosis wizard: back button, resume, correct progress denominator** | 4 h | Losing a 6-step run to one mis-tap is the worst UX in the app |
| B6 | **Colony delete: name + inspection count + undo** | 3 h | Deletes a season of records behind one yes/no |
| B7 | **DE/EN toggle contrast in theme C** | 1 h | Users must find the language switch |
| B8 | **Make `weiter` / `nochmal` do something** (or remove them) | 2 h | The app says "Weiter." and nothing happens |

### Track C — Performance (2 days)

| # | Item | Effort | Measured gain |
|---|---|---|---|
| C1 | Replace **`@onboardjs` with a 40-line state machine** | 4 h | **−109 KB precache (−11.9%)**; the first screen every user sees |
| C2 | **Lazy-load `diagnosis.json`** off the landing path | 4 h | −39.9 KB raw / −14.3 KB gz off first paint |
| C3 | **Parse the date once** in `orderInspections` | 1 h | 13.23 ms → 1.53 ms (8.6×) |
| C4 | **Memoize the chronology pass once** (currently 4×) | 3 h | −177 ms of the 237 ms main-thread block |
| C5 | **Font subset**: latin-only variable fonts; drop 10 `.woff` fallbacks + dead Playfair 900 | 3 h | −58 KB precache, −278 KB dead weight |
| C6 | Fix the **Playfair 600 vs 700 preload mismatch** | 10 min | −1 round-trip, no FOU |
| C7 | Remove the **non-passive `touchmove`** listener; use `touch-action` | 10 min | Scroll jank gone app-wide |
| C8 | Move the **`localStorage` read out of the first render** | 2 h | −4.75 ms @2,500 records |

### Track D — Quality (2 days) — buy the green suite back

| # | Item | Effort | Why |
|---|---|---|---|
| D1 | **Theme B/C render tests** — add `ThemeProvider` to the 18 test files missing it | 4 h | This is *why* A3 and A4 shipped |
| D2 | **Direct unit tests for `durableStorage.js`** incl. `migrateProfile` | 4 h | The migration function has never been called directly |
| D3 | **Close the 4 i18n lint blind spots** (ConditionalExpression / TemplateLiteral / `&&`) | 3 h | Live English-in-German violations today |
| D4 | **Turn on `no-undef` for `src/`** | 1 h | An undefined identifier currently exits 0 |
| D5 | **`useDiagnosisFlow` nextAction branch test** | 1 h | The newest seam is untested |
| D6 | **Offline-contract test** — assert precache entries and size | 1.5 d | *"That is the product."* |
| D7 | **`pool:'vmThreads'`** | 1 d | 172 s → ~90 s suite |
| D8 | **Install `coverage-v8`** and set a floor | 0.5 d | 40% of source files have no test; nobody can see it |

### Track E — Security (1.5 days)

| # | Item | Effort | Why |
|---|---|---|---|
| E1 | **`public/_headers`** with the CSP above + nosniff / Referrer-Policy / Permissions-Policy / HSTS | 2 h | One file, a whole class of headers |
| E2 | **SHA-pin all 7 GH Actions**; the wrangler action holds the Cloudflare token | 3 h | Mutable tag = mutable token |
| E3 | **Bound the import**: colony count, field length, byte ceiling — before writing | 3 h | A 152-byte file currently makes 10,000 colonies |
| E4 | **Fix `migrateProfile` discarding the file's own colonies** | 2 h | A restore can throw away the user's real hives |
| E5 | **Human gate on production dependency bumps** | 1 h | Auto-merge currently bypasses the `dependency-type` check |
| E6 | **Correct the privacy claim** in `strings.js:121` re: streaming mic audio | 0.5 h | The promise is the product's whole value |
| E7 | `npm ci --ignore-scripts` + a secret scan in CI | 1 h | Supply chain |

### Track F — The product bet (3–4 weeks) — *after* A–E

| # | Item | Effort | Why it's the bet |
|---|---|---|---|
| F1 | **Varroa threshold engine** — 3/100 May–Oct, 1/100 Feb (research fact F1, already cited) | 3 d | Attacks the #1 killer of beginner colonies using a number the user already types |
| F2 | **Structured treatment record** + "recount due" date | 2 d | The 5 `insp_treatment_*` keys prove the taxonomy was designed |
| F3 | **Manual `weightKg` + 7-day delta + anomaly** | 2 d | The ESP32 Phase 0 — most of the retention effect for €0. **This is the hardware gate.** |
| F4 | **Task date windows + repeat cadence** (date-stamped completions, not a boolean Set) | 4 d | Kills 13 identical cards × 12 weeks; makes completion meaningful |
| F5 | **One local notification** for the next action | 1 d | The weekly return reason |
| F6 | **Ship the research backlog into Learn** (31 facts → 11 shipped) | 1 d | Copying our own research file into our own JSON |
| F7 | **In-app "Send feedback" + local stats export** | 1 d | 0 issues + 0 analytics = a funnel nobody can see |
| F8 | **Donations link** + printable **Kontrollblatt** export | 1.5 d | The only credible revenue lines; 4 h for the link |
| F9 | **Backup mirror** (opt-in, own passphrase, own bucket, off by default) | 3 d | The only credible sync that survives the privacy story |

### Track G — Structural (1 week) — *parallel with F, not after it*

| # | Item | Effort | Why |
|---|---|---|---|
| G1 | **Version the inspection + task-log record schemas** + migrate hook | 2 d | §3.5 — the one-way door. Do this **before** F1/F2 add fields |
| G2 | **Finish the colony-record migration** — `InspectionTab.jsx:38` duplicates `groupByColony` | 2 d | Ends the refactor campaign |
| G3 | **Fix the docs drift**: Tailwind 3→4, precache numbers, screen count, Inspection shape, create `docs/adr/` | 3 h | *"The map of the code is lying"* |
| G4 | **Retire the weekly audit-bot issue** | 1 h | 6 filed, 6 closed, 0 real issues — pure noise |

**Total: ~22 days of defects + structure (A–E, G), ~15 days for the product bet (F).**

---

## 7. Answers to the direct questions

### "Anything open?"
Yes — **4 Dependabot PRs** (#152–#155) waiting, **2 stale merged branches** to delete, and **33 of 83 source files (40%) with no test**. No open product issues exist, because nothing has ever been filed by a user.

### "Should we plan improving performance?"
**Yes, but after the 2 days of defect fixes — and the top performance item is a UX item.** The 237 ms frozen tap is more damaging than the bundle size, and the bundle size has a specific, cheap fix: **109 KB of the 896 KiB precache is a day-one-only wizard library.**

### "Should we plan improving UI/UX?"
**Yes, and this is where the ROI is highest — 2 weeks turns "three blank buttons" into "solid / patchy / scattered / none."** The 14 semantic labels for the inspection scales are *already written in `strings.js` and never wired up*. That is the single cheapest perceived-quality jump available in this repository.

### "What should we do next?"
1. **Track A** — 2 days. Ship-blocking defects, including the 8 blank-label keys and the dropped bee-welfare warnings.
2. **Track B** — 2 weeks. Make the app legible and tappable for a beginner standing in a field.
3. **Track C+D+E** — 5.5 days. Shrink the precache 18%, close the theme and import blind spots, put one file of headers in place.
4. **Track G1 first** — version the inspection schema *before* adding any new inspection fields.
5. **Track F** — then build the calendar-driven, threshold-aware product: varroa thresholds, treatments, weight, notifications.

---

## 8. Stop / Start / Keep

**STOP**
- "Deepen the module" PRs with no user-visible outcome (56 of 75 commits in 8 weeks were refactor/chore/fix)
- Release-please bumps on dependency-only changes (24 tags in 8 weeks)
- The weekly audit-bot issue — 6 filed, 6 closed, 0 real issues
- Docs describing a system that doesn't exist (Tailwind 3, "56 entries", `docs/adr/`)

**START**
- Version the inspection schema before adding inspection fields
- Test the offline contract — it is the product
- Spec issues before features
- A `i18n/no-missing-string-key` rule and theme-aware render tests
- Measuring something: local stats export, a feedback button, a donations link
- A hardware *gate*: manual weight first, board only if the weight entry sticks

**KEEP**
- The `useStoredState` contract — one validator set across load/write/import
- The `i18n/no-hardcoded-ui-text` rule — 1 escape hatch in 14.4 k LOC is a good ratio
- The timezone matrix (Berlin + LA, 17 tests each)
- The credential-isolated deploy split
- `reloadSafety`
- DE-first bilingual — German is the harder language and it should stay the default

---

## 9. What to measure

With no backend, analytics would break the privacy promise. Measure locally and let the user choose to share:

| Metric | How | Why |
|---|---|---|
| Inspections recorded per week per colony | local counter, exported in the backup | **The core engagement metric.** If this doesn't rise, nothing else matters |
| Second weight entry within 8 weeks | local counter | **The hardware gate** (§4.5) |
| Seasonal task completion rate | local counter | Tests whether F4 (cadence) works |
| Varroa count entered ≥1× per season | local counter | Tests whether F1 reached the user |
| Language switch rate DE→EN | local counter | Validates the "German is default" bet |
| Backup exports | local counter | The donation nudge's conversion |
| Stars / issues / stars-per-release | public GitHub | The only external signal. Currently 0 |

---

## Appendix A — Verified evidence index

| Claim | Verification |
|---|---|
| 8 missing i18n keys | AST-free extraction of `s.*` from `src/{components,screens,hooks,utils}` vs `strings.js` keys; confirmed present in `dist/assets/InspectionTab-*.js` |
| `t(undefined)` → `''` | `src/context/LanguageContext.jsx:25` |
| `RiskNote` only in theme A | `src/components/TaskCard.jsx` — theme B branch line 23, theme C branch line 73, theme A line 106, single `<RiskNote>` at line 153 |
| `DiagnosisResult` ignores the theme | `src/components/DiagnosisResult.jsx:49,52,64,71,80,87` |
| Dependabot login mismatch | `gh pr list` → every merged bump authored by `app/dependabot`; workflow checks `dependabot[bot]` at `dependabot-automerge.yml:69` |
| Precache 896.47 KiB / 33 entries | `npm run build` output; `dist/sw.js` |
| Onboarding chunk 118,884 B | `npm run build` output |
| No schema version on inspections | `src/hooks/useInspections.js` — `acceptsInspections = uniqueRecords(value, isInspection)`; `durableStorage.js:1` (profile) vs `:244` (backup envelope) |
| README Tailwind drift | `README.md:36` "Tailwind CSS 3" vs `package.json:50` `"tailwindcss": "^4.3.3"` |
| 35 unused i18n keys | key-extraction diff |
| Branches merged | `git rev-list --left-right --count master...<branch>` → 0 ahead |
| Velocity 56 vs 7 | `git log --since=2026-08-24` subject prefixes |
| `npm audit` clean | `npm audit`, `npm audit --omit=dev` → 0 vulnerabilities |
| No `public/_headers` | `ls public/` → 2 PNGs only |

## Appendix B — Full specialist reports

```
/tmp/opencode/apiario-audit/ux-ui.md        512 lines, 39 findings
/tmp/opencode/apiario-audit/performance.md   517 lines
/tmp/opencode/apiario-audit/quality.md       460 lines
/tmp/opencode/apiario-audit/product.md       330 lines
/tmp/opencode/apiario-audit/esp32.md         ~8,300 words
/tmp/opencode/apiario-audit/security.md      700 lines, 14 findings
/tmp/opencode/apiario-audit/cto.md
```

*This report was produced by a read-only audit. No repository code was modified. The only change is this document.*
