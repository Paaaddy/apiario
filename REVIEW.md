# Apiario — Code, Security & Performance Review

**Date:** 2026-04-19  
**Repo:** https://github.com/Paaaddy/apiario  
**Stack:** Vite + React + JavaScript (PWA)

---

## Code Review

### CRITICAL

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/context/LanguageContext.jsx` | 31 | Loose `==` in translation function — falsy values (`0`, `''`, `false`) treated as null | Change to `value === null \|\| value === undefined` |

### HIGH

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/components/DiagnosisResult.jsx` | 12 | `handleShare()` async with no `.catch()` or try-catch — unhandled promise rejection | Wrap in try-catch |
| `src/hooks/useWakeLock.js` | 22–33 | `acquire()` / `release()` called without await in useEffect | Use `void acquire()` or handle explicitly |
| All `.jsx` files | — | No PropTypes or TypeScript interfaces on any component | Add PropTypes or migrate to `.tsx` |
| `useProfile.js:19`, `LanguageContext.jsx:26` | — | Empty `catch {}` silently swallows localStorage errors | Log in dev or document why safe to ignore |
| `src/hooks/useWakeLock.js` | 51–64 | Race condition — effect re-runs before acquisition completes, old `sentinelRef` lost | Stabilize callback deps or guard with ref |

### MEDIUM

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/components/DiagnosisResult.jsx` | 32 | `setTimeout` not cancelled on unmount — state update on unmounted component | Store ID, cancel in cleanup effect |
| `src/screens/DiagnoseScreen.jsx`, `SeasonScreen.jsx` | Multiple | 100+ line inline `style={{}}` objects — new object ref every render | Hoist to constants or CSS |
| `src/components/DiagnosisResult.jsx` | 59 | `key={i}` on list items | Use stable ID |
| `src/hooks/useProfile.js` | 74 | JSON parse error returns `DEFAULT_PROFILE` silently — masks data corruption | Log warning in dev |
| `src/hooks/useSeason.js` | 57 | Loose `!=` on `targetTime` comparison | Use `!==` |
| `src/components/VoiceOverlay.jsx` | 32–39 | `key={label}` is language-dependent — unstable across locale changes | Use stable index or ID |

### LOW

| File | Issue |
|------|-------|
| `src/utils/haptics.js` | Magic numbers (`25`, `30`, `50`) — extract to named constants |
| `src/hooks/useProfile.js` | Silent fallback to defaults — no user feedback on corruption |
| `src/context/LanguageContext.jsx:7,16` | Hardcoded `'de'` default — use `navigator.language` detection |

---

## Security Review

### CRITICAL

**DOM attribute injection via unsanitized localStorage — `ThemeContext.jsx:16,21`**

```javascript
// VULNERABLE
function setTheme(t) {
  setThemeState(t)
  localStorage.setItem('apiario-theme', t)  // no validation
}
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)  // trusts localStorage
}, [theme])

// FIXED
const VALID_THEMES = ['a', 'b', 'c']
function setTheme(t) {
  if (!VALID_THEMES.includes(t)) return
  setThemeState(t)
  localStorage.setItem('apiario-theme', t)
}
```

### HIGH

**Dependency vulnerabilities — `package.json`**

Run: `npm audit fix`

| Package | Version | Severity | Issue |
|---------|---------|----------|-------|
| `serialize-javascript` | <=7.0.4 | HIGH | RCE via RegExp/Date methods |
| `esbuild` | <=0.24.2 | MODERATE | HTTP request interception |

Both are dev/build deps, not runtime — but must be patched.

---

**No Content Security Policy — `index.html`**

Add to `<head>`:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">
```

---

**`localStorage.setItem` with no quota error handling — multiple files**

Affects: `useProfile.js:84`, `useTaskLog.js:18`, `LanguageContext.jsx:25`, `ThemeContext.jsx:12`

```javascript
// FIXED
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
} catch (e) {
  if (e.name === 'QuotaExceededError') console.error('Storage quota exceeded')
}
```

### MEDIUM

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/App.jsx` | 8 | Debug panel exposed via `?debug` URL param — users can view/clear all profile data | Remove from prod builds or require auth token |
| Multiple hooks | — | No schema validation on localStorage data — malformed data causes silent unexpected behavior | Add Zod schema validation |
| `vite.config.js` | 54–56 | Broad `globPatterns` caches everything including changing data files | Scope to stable assets only |

### LOW

| Issue | Notes |
|-------|-------|
| `console.warn` / `console.debug` in production | Wrap in `import.meta.env.DEV` |
| User data stored plaintext in localStorage | Acceptable for offline-only PWA; encrypt if sync ever added |
| No HTTPS enforcement headers | Handle at deployment layer (HSTS) |

### Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| No hardcoded secrets | ✅ PASS | No API keys found |
| Input validation | ⚠️ PARTIAL | No schema validation on localStorage data |
| SQL injection | ✅ N/A | Offline, no DB |
| XSS | ⚠️ ISSUE | Theme attribute unwhitelisted; no CSP |
| CSRF | ✅ N/A | Offline PWA |
| Auth | ✅ N/A | Single-user app |
| Rate limiting | ✅ N/A | No endpoints |
| Error message leakage | ✅ PASS | Generic error boundary |

---

## Performance Review

### HIGH Impact

**O(n²) log lookup in task list — `SeasonScreen.jsx:116`**

Same pattern in `DiagnoseScreen.jsx` and `MyHiveScreen.jsx`.

```javascript
// CURRENT — O(n) search per task = O(n²) total
tasks.map((task) => {
  const logEntry = log?.find((e) => e.type === 'task' && e.taskId === task.id)
  return <TaskCard ... />
})

// FIXED — O(1) lookup
const logByTaskId = useMemo(() => {
  const map = new Map()
  log?.forEach(e => { if (e.type === 'task') map.set(e.taskId, e) })
  return map
}, [log])

tasks.map((task) => {
  const logEntry = logByTaskId.get(task.id)
  return <TaskCard ... />
})
```

---

**Missing `React.memo` on list/nav components**

```javascript
// TaskCard.jsx — rendered in lists, no memo
export default memo(function TaskCard({ task, isChecked, ... }) {
  ...
}, (prev, next) => prev.task.id === next.task.id && prev.isChecked === next.isChecked)

// BottomNav.jsx — pure nav, re-renders on every tab change
export default memo(function BottomNav({ ... }) { ... })
```

---

**Inline style objects recreated every render — `SeasonScreen.jsx:66-130`, `DiagnoseScreen.jsx:52-237`, `MyHiveScreen.jsx:37-120`**

```javascript
// CURRENT — new object ref every render
<div style={{ position: 'relative', minHeight: '100%', background: '#faf6ee' }}>

// FIXED — hoist outside component
const containerStyle = { position: 'relative', minHeight: '100%', background: '#faf6ee' }
```

---

**8 font imports, no `font-display: swap` — `main.jsx:4-13`**

~150KB, render-blocking. Reduce to critical path (Inter 400/500 + Playfair 700). Lazy-load mono and decorative weights. Add `font-display: swap`.

### MEDIUM Impact

**No code splitting — all screens in one bundle**

```javascript
// App.jsx — lazy-load all screens
const SeasonScreen = lazy(() => import('./screens/SeasonScreen'))
const DiagnoseScreen = lazy(() => import('./screens/DiagnoseScreen'))
const MyHiveScreen = lazy(() => import('./screens/MyHiveScreen'))
const Onboarding = lazy(() => import('./screens/Onboarding'))  // 285 lines, first-launch only

{activeTab === 'season' && (
  <Suspense fallback={<LoadingUI />}>
    <SeasonScreen ... />
  </Suspense>
)}
```

---

**`HexWatermark` SVG duplicated in 3 screen files**

```javascript
// src/components/HexWatermark.jsx
export const HexWatermark = memo(() => (
  <svg width="100%" height="100%" style={{ position: 'absolute', ... }} aria-hidden>
    ...
  </svg>
))
```

### LOW Impact

| File | Issue |
|------|-------|
| `validateDiagnosis.js`, `ErrorBoundary.jsx` | `console.warn` / `console.debug` — guard with `import.meta.env.DEV` |
| `vite.config.js:54-56` | Overly broad SW glob caches all JSON including changing data files |
| `App.jsx:27-72` | 46-line `VOICE_CONFIG` object at module level — move to separate file |

### Bundle Size Estimate

| Category | Current | After Optimizations |
|----------|---------|---------------------|
| React + ReactDOM | ~60 KB | ~60 KB |
| Tailwind CSS | ~30 KB | ~30 KB |
| @onboardjs | ~18 KB | ~5 KB (lazy) |
| Fonts | ~150 KB | ~80 KB (subset) |
| App code | ~45 KB | ~35 KB (split) |
| **Total (gzipped)** | **~300 KB** | **~210 KB** |

---

## Optimization Roadmap

| Priority | File | Task | Effort |
|----------|------|------|--------|
| 🔴 | `ThemeContext.jsx:16` | Whitelist theme values | 5 min |
| 🔴 | `package.json` | `npm audit fix` | 2 min |
| 🔴 | `SeasonScreen.jsx:116` | Memoize log index map | 15 min |
| 🔴 | `TaskCard.jsx`, `BottomNav.jsx` | Add `React.memo` | 20 min |
| 🟠 | Multiple hooks | `try/catch` on all `localStorage.setItem` | 20 min |
| 🟠 | `index.html` | Add CSP meta tag | 5 min |
| 🟠 | `SeasonScreen`, `DiagnoseScreen`, `MyHiveScreen` | Hoist inline styles | 45 min |
| 🟠 | `App.jsx` | Lazy-load screens + Onboarding | 45 min |
| 🟠 | `main.jsx` | Reduce fonts, add `font-display: swap` | 20 min |
| 🟡 | `LanguageContext.jsx:31` | Fix loose equality | 2 min |
| 🟡 | `DiagnosisResult.jsx:32` | Clear setTimeout on unmount | 10 min |
| 🟡 | 3 screen files | Extract shared `HexWatermark` | 15 min |
| 🟢 | `validateDiagnosis.js` | Guard console calls with `DEV` flag | 5 min |
