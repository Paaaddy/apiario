# Apiario — Deep Product & Features Review

**Reviewer:** Sam, The Product Whisperer
**Date:** 2026-08-29

**Verdict: 7.5 / 10** — a beautifully-crafted, content-first beekeeping guide that secretly wants to be a journal but hasn't let the data show its value yet; the quickest wins all live in making the inspection data sing (trends, export, harvest) and wiring the onboarding answers into the experience.

---

## What works well — the genuinely coherent parts

- **The seasonal task library is genuinely expert-grade content.** Every task carries a `why`, an `urgency`, and most have a `RiskNote` (caution/warning + mitigation). Authors understood the core tension of beekeeping: *every intervention can harm bees.* Examples: the swarm-cell warning to "never destroy every queen cell without confirming the queen" (`sp-04`), the varroa wash noting the alcohol method kills 300 bees and offering the non-lethal sugar roll (`su-03`), the 15–20 kg winter-store math (`su-04`). Substantive, not filler.
- **The "secret tips" layer is a genuinely thoughtful gamified hook** — real facts (drone comb removes 10–30% of mites, `su-secret-02`; waggle dance, `sp-secret`/`su-secret`) unlocked by `completedCount` vs `unlockAt`. Rewards consistent use *and* adds real value (`au-secret-01` cites LAVES/FAO/USDA).
- **The Diagnosis tree is a real, defensible expert system** — not a toy. Covers queenlessness, varroa (suspect + DWV-confirmed), both foulbroods (AFB/EFB), chalkbrood, robbing, pesticide poisoning, heat bearding vs. pre-swarm clustering, winter die-off vs. real colony failure. Each outcome carries a `callExpert` flag (correctly true for AFB, false for chalkbrood) plus safe steps. The AFB node teaches the "ropiness test" (`diagnosis.json:135`). **This is the app's strongest asset.**
- **Integration of inspection data into diagnosis (`routeFromInspection`)** is genuinely coherent: `DiagnoseScreen.jsx:18-24` maps `queenStatus: 'not_seen'` → queenless, `varroa >= 3` → varroa-suspect, `broodPattern <= 2` → sick-brood, and surfaces a "🔍 from inspection" shortcut on root. Wired end-to-end.
- **Offline/PWA is genuinely delivered.** `vite.config.js` precaches woff2 + all assets, fonts self-hosted via `@fontsource`, `requestPersistentStorage()` post-onboarding, auto-update SW, install prompt + iOS standalone detection, an **app-icon badge showing outstanding urgent+important tasks** (`App.jsx:62-70` + `useAppBadge.js`), and a **screen wake-lock outdoors** (`useWakeLock` in DiagnoseScreen). The last two are exactly what a beginner in the field needs. Manifest shortcuts correctly relative for GitHub Pages.
- **Accessibility & craft are unusually strong** — focus-trapped Escape-close dialog (`InspectionForm.jsx:43-63`), keyboard-activatable options, `aria-pressed`, `sr-only` labels, full provider discipline throughout.

---

## Gaps & missing features — ranked by user value vs effort

| # | Gap | User value | Effort | Note |
|---|---|---|---|---|
| 1 | **Export / backup of data** | 🔥🔥🔥 | Low | All data is localStorage on one device — wiped browser = total loss of every colony/inspection/year. No export/import (share.js is diagnosis-only). #1 trust killer for a journal app. |
| 2 | **Colony health trends / charts** | 🔥🔥🔥 | Med | `useInspections` already collects time-series varroa + brood + population per colony; nothing renders a trend. Goldmine of data with zero payoff. Most obvious next feature. |
| 3 | **Honey harvest tracking** | 🔥🔥 | Low | Content *instructs* harvesting (`su-04`) but the model can't record actual yield per colony. Beginner's emotional payoff. |
| 4 | **Treatment history records** | 🔥🔥 | Low | `treatment` is free text on an inspection. Varroa treatment is the most safety-critical repeated action (oxalic acid in `wi-04`); structured treatment log (date/compound/dose) would support the safety content. |
| 5 | **Reminders / due-dates** | 🔥🔥 | Med | Tasks are per-season but unscheduled. "Cut drone frame within 24 days" / "recount mites in 4–6 weeks" are date-bound in content but the app can't remind. |
| 6 | **Photos per colony/inspection** | 🔥 | Med | "Does this look like AFB?" is visual; a photo on an inspection would transform diagnosis. |
| 7 | **Weather context** | 🔥 | Med | Risk mitigations are temperature-derived ("only open above 12°C", "bearding over 30°C"). Has `climateZone` but never surfaces today's temperature. |

Also conspicuously absent: **swarm-prevention planning**, **per-colony queen age/info** (the single most important colony fact), and a **guided "first inspection" walkthrough** using the diagnosis tree.

---

## Fuzzy / half-baked feature critique

1. **`climateZone` and `hiveCount` are effectively dead settings for new users.** Onboarding collects both (`Onboarding.jsx:213-247`), but `updateProfile({ ...answers })` (`App.jsx:138`) never seeds colonies from `hiveCount` — colony seeding only happens in the *v1→v2 migration* (`useProfile.js:47-59`), i.e. only for pre-existing installs. A new user who says "5 hives" is told "ready!" and lands on an **empty My Hive**. **`climateZone` is never read anywhere** — not in task filtering, not in diagnosis. `experience` is the *only* answer that gates anything (`minExperience` in `useSeason.js:37-41`). **The biggest coherence crack: two of three onboarding questions are decorative.**

2. **`hiveCount` at the Profile level is orphaned** — still editable in ProfileSection, but the real colony list is a separate manually-managed `colonies[]` array never reconciled with `hiveCount`. They can drift arbitrarily.

3. **Voice is a demo-toy in disguise.** Architecture is genuinely clean (locale-aware SR, `voiceCommands.js`, permission-recovery modal) — but it's a **navigation remote, not hands-free beekeeping**. Commands only switch tabs (season/diagnose/myhive), "next", "read again", "stop". It **cannot navigate to the Inspect tab** (missing from `VOICE_CONFIG`), and "next"/"repeat" don't advance/read the diagnosis wizard or tasks — they speak a canned acknowledgment and do nothing (`voiceCommands.js:76-81`, `App.jsx:108-112`). **Not discoverable** — only affordance is a floating 🐝 FAB; nothing explains it in onboarding. `SpeechRecognition` is Chrome-only, dead on iOS PWA.

4. **Diagnosis tree is shallow and the step meter is fake.** Max depth ~3 question nodes; the `/06` hard-coded step counter in themes B/C (`DiagnoseScreen.jsx:78,152`) is decorative/misleading — many outcomes reached in 1–2 steps yet the bar implies 6. Theme A is honest.

5. **The log's custom entries are free text only** (`LogSection.jsx`); task log is typed (`task` vs `custom`). No way to log against a *colony* — the log is hive-agnostic while inspections/colonies are the de-facto per-colony record. Log and inspections coexist without linking, fragmenting the "history" story.

6. **`getSeasonWeek` is dead code** — defined `utils/season.js:20`, tested (`season.test.js:42`), never imported anywhere (UI uses ISO weeks via `getIsoWeek`).

7. **`DiagnoseScreen.corrupted.test.jsx`** — a test with "corrupted" in the filename alongside the real `DiagnoseScreen.test.jsx`. Harmless (graceful-fallback guard) but signals messy naming.

---

## Where it over/under-delivers on the "beginner beekeeper" promise

- **Over-delivers:** the *content* (seasonal tasks + risks + secret tips + diagnosis tree) is far above typical — genuinely authoritative and safety-conscious. The *craft* (theming, a11y, offline/PWA polish, wake-lock, app badge) is beyond expectation.
- **Under-delivers:** the *data layer*. For an app that asks a beginner to log inspections and keep a journal, it fails to make that data *useful* — no trends, no harvest, no per-colony summary, no export, and the two most important onboarding answers don't shape the experience. The gap between how much care went into the *content* and how little payoff comes from the *collected data* is the defining imbalance. A beginner keeps a journal to *see progress*; Apiario records it but never shows it back.

---

## Product posture verdict

**7.5 / 10** — A beautifully-crafted, content-first beekeeping guide that secretly wants to be a journal but hasn't let the data show its value yet; the quickest wins all live in making the inspection data sing (trends, export, harvest) and wiring the onboarding answers into the experience.

**Single highest-leverage fix:** new users who say "5 hives" land on an empty hive list because `hiveCount` never seeds `colonies[]` for fresh onboardings (`App.jsx:138` → `useProfile.js:47-59` path only runs for legacy profiles). Seeding colonies at onboarding would make first-run dramatically more coherent at almost zero effort.
