# Plan: Fix Audit Issues

**Source:** `docs/audit-2026-05-01.md`
**Goal:** Close all 16 open issues. Grouped by wave to minimise context switching.

---

## Wave 1 — Quick wins (XS effort, high value)

All items mechanical, independent, committable individually.

### 1.1 · Extract `saveProfile` helper
**File:** `src/hooks/useProfile.js`
Four callbacks repeat `try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}`.
```js
function saveProfile(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}
```
Replace all four inline try/catch blocks with `saveProfile(next)`.

### 1.2 · `useMemo` for `TABS` in BottomNav
**File:** `src/components/BottomNav.jsx:45`
```js
const TABS = useMemo(() => [...], [t])
```

### 1.3 · `useCallback` for `t` in LanguageContext
**File:** `src/context/LanguageContext.jsx:29`
```js
const t = useCallback((val) => { ... }, [locale])
```

### 1.4 · `useMemo` for `logByTaskId` in SeasonScreen
**File:** `src/screens/SeasonScreen.jsx:31`
```js
const logByTaskId = useMemo(() => new Map(log.map(e => [e.taskId, e])), [log])
```

### 1.5 · Deduplicate step counter in DiagnoseScreen
**File:** `src/screens/DiagnoseScreen.jsx`
Compute `stepLabel` once above the theme branch, reference in all branches.

---

## Wave 2 — Critical test gaps

Write tests first (RED), verify they pass against existing code (GREEN).

### 2.1 · `useProfile.test.js` — corrupted localStorage + whitespace name
**File:** `src/hooks/useProfile.test.js`

```js
it('returns DEFAULT_PROFILE when localStorage contains invalid JSON', () => {
  localStorage.setItem('apiario-profile', '{corrupted')
  const { result } = renderHook(() => useProfile(), { wrapper })
  expect(result.current.profile.onboardingDone).toBe(false)
  expect(result.current.profile.colonies).toEqual([])
})

it('addColony falls back to "Hive N" when name is whitespace-only', () => {
  const { result } = renderHook(() => useProfile(), { wrapper })
  act(() => result.current.addColony('   '))
  expect(result.current.profile.colonies[0].name).toBe('Hive 1')
})
```

### 2.2 · `useTaskLog.test.js` — corrupted localStorage + MAX_ENTRIES cap
**File:** `src/hooks/useTaskLog.test.js`

```js
it('returns empty log when localStorage contains invalid JSON', () => {
  localStorage.setItem('apiario-log', '{corrupted')
  const { result } = renderHook(() => useTaskLog())
  expect(result.current.log).toEqual([])
})

it('caps log at 500 entries', () => {
  localStorage.setItem('apiario-log', JSON.stringify(
    Array.from({ length: 501 }, (_, i) => ({
      type: 'task', taskId: `t${i}`, date: '2026-01-01',
    }))
  ))
  const { result } = renderHook(() => useTaskLog())
  expect(result.current.log).toHaveLength(500)
})
```

### 2.3 · `useLanguage.test.jsx` — t() missing-key edge case
**File:** `src/hooks/useLanguage.test.jsx`

```js
it('t() returns empty string for object missing both de and en', () => {
  const { result } = renderHook(() => useLanguage(), { wrapper })
  expect(result.current.t({})).toBe('')
})
```

### 2.4 · `useSeason.test.js` — profile=null
**File:** `src/hooks/useSeason.test.js`

```js
it('returns empty tasks when profile is null', () => {
  const { result } = renderHook(() => useSeason(null))
  expect(result.current.tasks).toEqual([])
})
```

---

## Wave 3 — New test files

### 3.1 · `src/utils/validateDiagnosis.test.js`
Cover:
- Valid tree passes without warnings
- Missing root node is flagged
- Node with broken `next` pointer (references non-existent node ID) is flagged
- Outcome node with `callExpert: true` passes

### 3.2 · `src/hooks/useTheme.test.jsx`
Cover:
- Default theme is `'a'`
- `setTheme('b')` persists to localStorage and updates `data-theme` on `document.documentElement`
- Invalid theme value is sanitised to `'a'`
- Theme loaded from existing localStorage value on mount

### 3.3 · `src/screens/DiagnoseScreen.test.jsx` — corrupted tree
Mock `../data/diagnosis.json` with a node whose `next` target doesn't exist. Verify the app does not white-screen — either `ErrorBoundary` catches or the screen renders a safe fallback.

---

## Wave 4 — Larger refactors (confirm before executing)

### 4.1 · `useMemo` for option arrays in ProfileSection
**File:** `src/screens/ProfileSection.jsx:33`
```js
const HIVE_OPTIONS = useMemo(() => [
  { label: t(s.hive_1), value: 1 },
  { label: t(s.hive_2), value: 2 },
  { label: t(s.hive_5), value: 5 },
  { label: t(s.hive_10), value: 10 },
], [t])
// same pattern for ZONE_OPTIONS, EXPERIENCE_OPTIONS
```

### 4.2 · Extract `SeasonHeader` component
**File:** `src/screens/SeasonScreen.jsx`
Themes B and C repeat palette computation and date formatting. Extract a `SeasonHeader` component accepting `palette`, `season`, `selectedDate` props. Theme A keeps existing header.
Estimate: ~40 lines net reduction.

---

## Execution order

```
Wave 1  →  commit "refactor: wave-1 quick wins from audit"
Wave 2  →  commit "test: critical recovery paths (T-1 T-2 T-3 T-6 T-7 T-8)"
Wave 3  →  commit "test: new test files for validateDiagnosis, useTheme, DiagnoseScreen"
Wave 4  →  commit "refactor: wave-4 memoisation and SeasonHeader extraction"
```

Each wave is a standalone green build. Do not bundle waves.

---

## Done criteria

- [ ] All 16 issues from `audit-2026-05-01.md` resolved
- [ ] `npm run test:run` green
- [ ] `npm run build` green
- [ ] Quality score ≥ 8/10 on re-audit
