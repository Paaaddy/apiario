# Apiario v2 — Design Spec
_Date: 2026-04-13_

## Overview

Four new features added to the existing Apiario PWA:

1. **Fixed (sticky) header** — amber header on every screen stays pinned to the top as content scrolls underneath.
2. **Language toggle (DE/EN)** — German is the default language. A DE/EN button in every screen's sticky header switches the entire app instantly.
3. **Season task checkboxes** — each task card gets a checkbox. Tapping it marks the task done, records it to the log with today's date, and shows it as green/crossed-out.
4. **Hive tracking log** — a "Verlauf" (history) section in the My Hive tab shows all activity: auto-entries from checked tasks (green) and user-written custom entries (brown). A "+ Eigener Eintrag" button opens an inline form for free-text notes.

---

## Architecture

### Language system

A `LanguageContext` (React context) provides `locale` (`'de'` | `'en'`) and a `t()` function to every component. `useLanguage` hook manages the locale state and persists it to `localStorage` under `apiario-locale`. German is the default.

All UI strings live in `src/i18n/strings.js` as a flat key/value dictionary with `de` and `en` variants. All content in `seasons.json` and `diagnosis.json` is bilingual: every translatable field becomes `{ de: "...", en: "..." }`. The `t()` function handles both: if passed a `{ de, en }` object it returns the right branch; if passed a plain string it returns it unchanged.

### Task log

`useTaskLog` hook manages all log entries in `localStorage` under `apiario-log`. Two entry types:

```js
// Auto-entry when a season task checkbox is ticked
{ id: string, type: 'task', taskId: string, taskName: { de, en }, completedAt: ISO-date-string }

// Manual custom entry
{ id: string, type: 'custom', text: string, date: ISO-date-string }
```

The hook exposes:
- `log` — array of all entries, sorted newest-first
- `completedTaskIds` — Set of taskIds checked off (used by SeasonScreen to drive checkbox state)
- `toggleTask(task)` — adds or removes a task entry; toggling off removes it
- `addCustomEntry({ text, date })` — appends a custom entry
- `deleteEntry(id)` — removes any entry by id

Checkboxes do not reset on a new week/season — the log is a permanent record. If a user wants to re-do a task they can uncheck it.

### Sticky header

Every screen's amber header `<div>` gains `sticky top-0 z-20`. The `<main>` in App.jsx already has `overflow-y-auto` so sticky positioning works correctly inside the scroll container.

### Profile section change (My Hive)

The existing three OptionGroups stay unchanged and move below the Verlauf section. Layout top-to-bottom: sticky header → Verlauf → Profile options. No chips or collapsed view — the screen scrolls.

---

## File Map

```
src/
  i18n/
    strings.js              # All UI strings: { de: {...}, en: {...} }
  context/
    LanguageContext.js      # React.createContext + LanguageProvider component
  hooks/
    useLanguage.js          # locale state, t() function, localStorage persistence
    useLanguage.test.js
    useTaskLog.js           # log entries: task completions + custom notes
    useTaskLog.test.js
  components/
    LanguageToggle.jsx      # DE/EN pill button, reads/writes locale via context
    TaskCard.jsx            # MODIFIED: add checkbox prop + onToggle + isChecked
    TaskCard.test.jsx       # MODIFIED: add checkbox tests
  screens/
    SeasonScreen.jsx        # MODIFIED: sticky header, pass useTaskLog down
    MyHiveScreen.jsx        # MODIFIED: sticky header, add Verlauf + custom entry form
    DiagnoseScreen.jsx      # MODIFIED: sticky header + translate strings
    Onboarding.jsx          # MODIFIED: translate strings
  App.jsx                   # MODIFIED: wrap in LanguageProvider, pass log to screens
  data/
    seasons.json            # MODIFIED: all name/why/label fields → { de, en }
    diagnosis.json          # MODIFIED: all question/diagnosis/actions/label fields → { de, en }
```

---

## Feature Details

### 1. Fixed header

Each screen's header div:
```jsx
<div className="bg-honey px-6 pt-8 pb-5 sticky top-0 z-20 border-b border-honey-dark/20">
```

This works because `<main className="flex-1 overflow-y-auto">` in App.jsx is the scroll container. `sticky top-0` pins the header to the top of that container.

### 2. Language toggle

`LanguageToggle` component renders in every screen header, top-right:

```jsx
// Appearance: two pills side by side — active one is white on honey-dark, inactive is dimmed
<button>
  <span active>DE</span>
  <span>EN</span>
</button>
```

Clicking either pill calls `setLocale('de')` or `setLocale('en')` from LanguageContext. All `t()` calls re-render with new locale automatically because locale is React state.

`strings.js` covers all static UI strings:
- Navigation labels (Saison / Season, Diagnose, Mein Stock / My Hive)
- Screen headings and subtitles
- Onboarding step labels and option labels
- Profile option labels (hive counts, zones, experience)
- Task urgency labels (Routine / Wichtig / Dringend)
- Log section labels (Verlauf / History, Eigener Eintrag / Custom entry, Erledigt / Done, Saisonaufgabe / Season task)
- Diagnosis wizard labels (Step N, Start over / Neu starten, call expert warning)
- Voice overlay strings
- Bee FAB aria-label

`seasons.json` and `diagnosis.json` are updated so every human-readable string is `{ "de": "...", "en": "..." }`. Structural fields (`id`, `urgency`, `type`, `next`, `callExpert`, `minExperience`) remain plain values.

### 3. Season task checkboxes

`TaskCard` receives two new props: `isChecked: boolean`, `onToggle: () => void`.

When `isChecked`:
- Left border becomes green (`border-green-400`)
- Checkbox circle fills green with a checkmark
- Task name is crossed out and dimmed
- A small green "Erledigt · DD.MM" badge appears

When not checked:
- Checkbox is an unfilled circle (existing urgency border colour)

`SeasonScreen` pulls `completedTaskIds` and `toggleTask` from `useTaskLog` and passes them to each `TaskCard`.

### 4. Hive tracking log (My Hive)

My Hive screen layout (top to bottom, all scrollable under sticky header):

**Verlauf section:**
- Section header: "Verlauf" label + "+ Eigener Eintrag" button (right-aligned)
- Entries grouped by month (month label as section separator)
- Each entry:
  - Green left border + `✓ Task name` + date (right) + "Saisonaufgabe abgehakt" subtitle — for type `'task'`
  - Brown left border + `📝 text` + date (right) — for type `'custom'`
  - Small × icon (top-right of each entry) to delete it

**Custom entry form** (shown inline above the entry list when "+ Eigener Eintrag" is tapped):
- Text input: "Was hast du gemacht? / What did you do?"
- Date input: defaults to today (YYYY-MM-DD), user can change
- "Speichern / Save" and "Abbrechen / Cancel" buttons
- On save: `addCustomEntry({ text, date })`, form hides

**Profile section** (below Verlauf):
- Section header: "Profil" / "Profile"
- Same three OptionGroups (hive count, climate zone, experience) — unchanged from v1

---

## Data Format Changes

### seasons.json (example task)

Before:
```json
{ "id": "sp-01", "name": "First hive inspection", "why": "Confirm the colony survived winter.", "urgency": "important", "minExperience": 0 }
```

After:
```json
{ "id": "sp-01", "name": { "de": "Erste Frühjahrskontrolle", "en": "First hive inspection" }, "why": { "de": "Bestätigen, dass das Volk den Winter überlebt hat und die Königin legt.", "en": "Confirm the colony survived winter and the queen is laying." }, "urgency": "important", "minExperience": 0 }
```

Season labels and icons also bilingual:
```json
"spring": { "label": { "de": "Frühling", "en": "Spring" }, "icon": "🌸", ... }
```

### diagnosis.json (example node)

Before:
```json
{ "type": "question", "question": "What are you seeing?", "options": [{ "label": "Very few bees", "next": "few-bees" }] }
```

After:
```json
{ "type": "question", "question": { "de": "Was siehst du am oder im Bienenstock?", "en": "What are you seeing in or around the hive?" }, "options": [{ "label": { "de": "Sehr wenige Bienen — Volk scheint viel kleiner", "en": "Very few bees — colony seems much smaller" }, "next": "few-bees" }] }
```

Outcome nodes: `diagnosis` and each item in `actions` become `{ de, en }`. `callExpert` stays boolean.

---

## Out of Scope

- Cloud sync of the log
- Photo attachments on log entries
- Filtering or searching the log
- Per-hive tracking (assumes single-hive view)
- Push notifications for overdue tasks
