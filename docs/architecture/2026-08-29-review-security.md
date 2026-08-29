# Apiario — Deep Security Review

**Reviewer:** Mara, The Paranoid Sentinel
**Date:** 2026-08-29
**Target:** client-only offline-first React PWA (beekeeping), no backend
**Method:** read-only code investigation, production-bundle verification

---

## Severity-Ordered Findings

### Finding 1 — Debug panel correctly gated out of production (NOT a vulnerability)
- **Locations:** `src/App.jsx:30`, `src/App.jsx:215`
- **Gate:** `const DEBUG = import.meta.env.DEV && ...has('debug')`
- **Analysis:** `import.meta.env.DEV` is statically replaced with `false` at build time. Verified the **production `dist/` bundle contains zero DebugPanel markers** ("Debug / Reset onboarding / Clear log / Test vibration" all absent). The panel (`DebugPanel.jsx`) exposes a state-dump + localStorage **reset buttons** — but this surface does not ship. In dev only, and only with `?debug`.
- **Impact:** None in production. Risk only if someone strips the `import.meta.env.DEV` guard.

### Finding 2 — Persistent state parsing is guarded everywhere (NOT exploitable)
- **Locations:**
  - `src/hooks/useProfile.js:65-80` — `JSON.parse` in try/catch, defaults on failure, schema migration (v0→v2)
  - `src/hooks/useTaskLog.js:7-15` — `JSON.parse` try/catch, array shape check
  - `src/hooks/useInspections.js:7-15` — `JSON.parse` try/catch, array shape check
  - `src/context/LanguageContext.jsx:6-12` — plain `getItem`, string, try/catch
  - `src/context/ThemeContext.jsx:11-13` — value **whitelist-sanitized** via `sanitizeTheme`
- **Prototype pollution:** `useProfile.loadProfile` does `{ ...DEFAULT_PROFILE, ...migrated }`. A malicious `{"__proto__": {...}}` in localStorage is **not** a pollution vector — `JSON.parse` and object spread both create `__proto__` as a plain own data property (modern engines). No `Object.assign`-into-`{}`.
- **Theme attribute injection:** `sanitizeTheme` (ThemeContext.jsx:6-8) whitelists `['a','b','c']`, so a poisoned `apiario-theme` can't inject arbitrary attributes into `setAttribute('data-theme', ...)` (ThemeContext.jsx:24,29).
- **Impact:** None found. Robust against corrupted/poisoned localStorage.

### Finding 3 — No XSS vector anywhere (NOT exploitable)
- **Locations:** grep across all JSX — **zero** `dangerouslySetInnerHTML`, zero dynamic `src`/`href`/`iframe`/`object`/`embed` with user data.
- All user-controlled strings rendered as **JSX text children** (auto-escaped by React):
  - Colony names/notes — `ColoniesSection.jsx:145,149`
  - Inspection notes/treatment — `InspectionCard.jsx:98-101`
  - Custom log entries — `LogSection.jsx:132`
  - Voice transcript — `VoiceOverlay.jsx:46`
- **`t()` translation resolver** (`LanguageContext.jsx:24-31`) returns localized strings or passes strings through — never injects HTML.
- **Web Share payload** (`DiagnosisResult.jsx:17-44`, `utils/share.js`) only contains **static** diagnosis strings + `window.location.href`. No user input in the share body.
- **CSP** present in `index.html:5-6` and carried into built `dist/index.html`: `default-src 'self'; script-src 'self'; ...`.
- **Impact:** None. React's escaping + CSP = no practical XSS.

### Finding 4 — Input "validation" is conformity, not security (informational)
- **Locations:** `maxLength` on colony name (100, `ColoniesSection.jsx:104,196`), notes (300, `:112,205`), log text (500, `LogSection.jsx:63`), inspection treatment (500, `InspectionForm.jsx:265`), inspection notes (1000, `:277`); `.trim()` everywhere; varroa numeric regex `InspectionForm.jsx:98`.
- **Analysis:** For a JSX-rendering client app this is sufficient — React handles escaping. `maxLength` is client-side only but that's a non-threat surface here. No server to validate against.

### Finding 5 — Dependency review (low / informational)
- Deps are **minimal and expected**: React 19, four `@fontsource` packages, `@onboardjs/core`/`react`, vite + `vite-plugin-pwa` + workbox + vitest.
- **Flags:**
  - `@onboardjs/core` `^1.0.0-rc.4` and `@onboardjs/react` `^1.0.0-rc.5` are **release candidates** (`package.json:20-21`). RC supply-chain hygiene note; CSP + no-eval keep runtime impact low.
  - **No `npm audit` in CI**: `deploy.yml:66` runs `npm ci --no-audit --no-fund`. The single most actionable improvement — an `npm audit --audit-level=high` gate would catch known-CVE deps automatically.
- **Impact:** No known-vulnerable or deprecated deps found. Informational.

### Finding 6 — PWA / Service Worker (NOT problematic)
- **`vite.config.js:54-56`:** `globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}']` — only static assets precached. No cache of user data (user data lives in localStorage, never in cache storage).
- **`registerType: 'autoUpdate'`** + `src/pwa/registerAutoUpdate.js` — auto-updates SW, reloads on `onNeedRefresh`, re-polls hourly. A **service-continuity** consideration (may reload mid-use), not a security hole. Workbox `generateSW` only matches same-origin static globs; `connect-src 'self'` blocks external fetch.
- **Manifest:** relative shortcut URLs (`vite.config.js:35-51`), correctly relative to avoid apex 404s. `id-token: write` in deploy is GitHub's required Pages permission. No bad headers; `default-src 'self'` blocks framing of other origins' content.
- **Impact:** None. Minor UX note about autoUpdate mid-session reload.

### Finding 7 — Secrets / tokens / keys (NONE)
- Grep for `api_key|secret|password|token|Bearer|authorization` → **zero** application secrets. Only matches: GitHub Actions `secrets.GITHUB_TOKEN`/`GH_TOKEN` (standard, per-run, scoped) and the word "Secret" in UI strings for gamified "secret tips".
- **No `.env` files**, no API keys bundled. No-backend offline-first app — nothing to steal client-side.

---

## Real, Exploitable vs. Theoretical

| Finding | Verdict |
|---|---|
| Debug panel exposure | **Not a bug** — stripped from prod, verified in bundle |
| Unsafe JSON.parse / proto pollution | **Not exploitable** — guarded + spread-safe |
| XSS (innerHTML, src/href sinks) | **Not present** |
| Input validation | Adequate for client-only; no vuln |
| Deps / supply chain | **Only actionable finding**: no `npm audit` gate in CI (informational) |
| PWA/SW | No vuln; autoUpdate UX note |
| Hardcoded secrets | **None** |

**No realistic, remotely-exploitable vulnerability was found.** The architecture (no backend, no network writes, localStorage-only, strict CSP, JSX-escaped rendering, gated debug surface) removes essentially every classic attack surface.

---

## Security Posture Verdict

**Score: 9.5 / 10**

A hardened, defense-in-depth client-only PWA — no backend or shared state to compromise, strict same-origin CSP in the shipped bundle, zero `dangerouslySetInnerHTML`, decode-safe guarded localStorage parsing with schema migration, a production-stripped debug surface (verified in `dist/`), and no secrets in the tree.

**Only two non-blocking recommendations for perfection:**
1. Add an `npm audit --audit-level=high` gate to CI (`deploy.yml` build job).
2. Pin `@onboardjs/core`/`react` to a stable (non-`-rc`) release once one exists.
