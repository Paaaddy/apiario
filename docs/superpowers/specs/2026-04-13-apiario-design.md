# Apiario — Design Spec
_Date: 2026-04-13_

## Concept

**Apiario** (Italian for "apiary") is a Progressive Web App for beginner beekeepers. It replaces the need for an in-person mentor by delivering seasonal guidance adapted to the user's hive and local climate, plus a guided diagnosis wizard when something looks wrong. It runs fully offline — beekeepers work in gardens and fields with no signal. A floating bee button provides a voice/hands-free demo mode for when both hands are occupied.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React (Vite) |
| PWA / offline | `vite-plugin-pwa` + Workbox (precache all assets + JSON content) |
| Styling | Tailwind CSS |
| State | React context + localStorage (no backend, no account) |
| Voice | Web Speech API (SpeechSynthesis + SpeechRecognition) |
| Content | Static JSON files bundled in the app |

---

## Visual Design

- **Palette:** Honey golds (`#f5a623`, `#f7c948`), earthy browns (`#3d1f00`, `#92400e`), warm cream backgrounds (`#fffbeb`, `#fff8e7`)
- **Typography:** Serif for headings and task names, sans-serif for body/labels
- **Feel:** Warm, organic, crafted — like a trusted field guide, not a clinical app
- **Cards:** Rounded corners, warm white, left-border accent in amber
- **Season banner:** Full-width amber header with current season + week number

---

## Navigation

3-tab bottom nav bar, always visible. Large tap targets (glove-friendly).

| Tab | Icon | Screen |
|---|---|---|
| Season | 📅 | Weekly task cards for current season |
| Diagnose | 🔎 | Guided problem diagnosis wizard |
| My Hive | 🐝 | User profile / hive settings |

Plus a **floating bee FAB** (right side, above tab bar) — see Bee FAB section.

---

## First Launch — Onboarding

3-step flow before the main app:

1. **Hive count** — how many hives do you keep? (1, 2–3, 4–9, 10+)
2. **Climate zone** — where are you located? (Northern Europe / Central Europe / Mediterranean / Other)
3. **Experience level** — how long have you been keeping bees? (First year / 1–3 seasons / Experienced)

Stored in localStorage. After onboarding → lands on Season tab.

---

## Season Tab

- Auto-detects current season from device date (Spring / Summer / Autumn / Winter)
- Displays week number within the season
- Shows 3–5 task cards for the current period, filtered by profile (experience level, hive count)
- **Task card anatomy:**
  - Task name (e.g. "Inspect brood frames")
  - One-line explanation of why it matters
  - Urgency badge: Routine / Important / Urgent
- Cards are static — content lives in a bundled `seasons.json` file, no server call needed
- Warm illustrated season banner at top

---

## Diagnose Tab

Guided branching wizard — teaches the user what to look for while diagnosing.

- Starts broad: "What are you seeing?" with 4–6 visual/behavioural options
- Branches based on answers, one question at a time
- Progress indicator at top: "Step 3 of ~6"
- Covers: queen issues, varroa mites, disease signs, swarming behaviour, starvation, pest intrusion
- All questions + outcomes stored in a bundled `diagnosis.json` tree
- **End state:** Diagnosis card showing:
  - Likely cause
  - What to do (step-by-step)
  - When to call an expert
- "Start over" button always visible

---

## My Hive Tab

- Edit hive count, climate zone, experience level
- Changes immediately re-filter seasonal content
- Stored in localStorage — no account, no backend, no sync
- Simple form with large touch-friendly inputs

---

## Bee FAB — Voice / Hands-Free Mode

A floating bee emoji button, fixed to the bottom-right of the screen, above the tab bar.

**At rest:**
- Gentle bobbing animation (CSS keyframe, subtle vertical oscillation)
- No tooltip on subsequent visits; shown once on first launch: "Tap to go hands-free"

**On tap:**
- Screen dims with a warm dark overlay
- Bee grows and pulses with an amber glow ring
- Voice overlay card appears in centre showing available commands:
  - `"next"` — advance to next task / next question
  - `"read again"` — repeats current content aloud
  - `"diagnose"` — jumps to Diagnose tab
  - `"stop"` — exits hands-free mode
- Web Speech API (`SpeechSynthesis`) reads the current task or question aloud
- Web Speech API (`SpeechRecognition`) listens for commands continuously
- Tap bee again or say "stop" to dismiss overlay and return to normal mode

**Demo scope:** This is a demo implementation. Voice recognition handles the four commands above. No AI/LLM backend in this version.

---

## Offline Strategy

- `vite-plugin-pwa` generates service worker + PWA manifest at build time
- Workbox precaches: all JS/CSS bundles, `seasons.json`, `diagnosis.json`, fonts, icons
- App shell strategy: app loads from cache instantly, zero network required after first visit
- Installable to home screen on Android and iOS

---

## Content Files

Two static JSON files bundled in the app:

### `seasons.json`
```
{
  "spring": { "weeks": [ { "week": 1, "tasks": [ ... ] } ] },
  "summer": { ... },
  "autumn": { ... },
  "winter": { ... }
}
```
Each task: `{ id, name, why, urgency, minExperience, minHives }`

### `diagnosis.json`
```
{
  "root": { "question": "...", "options": [ { "label": "...", "next": "node-id" } ] },
  "node-id": { ... },
  "outcome-id": { "diagnosis": "...", "actions": [...], "callExpert": bool }
}
```

---

## Out of Scope (v1)

- User accounts / cloud sync
- Hive inspection journal / photo logging
- AI/LLM backend
- Push notifications
- Multi-language support
