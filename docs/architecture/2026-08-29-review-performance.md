# Apiario — Deep Performance Review

**Reviewer:** Vera, The Clock-Counter
**Date:** 2026-08-29

**Verdict: 7.5/10** — a well-split, correctly-memoized app with genuinely tiny lists; the real costs are the oversized entry bundle and FOUT from lazily-discovered fonts — neither causes interactive jank.

---

## Findings, severity-ordered

### P1 — No vendor/manualChunks split: entry bundle is 248KB raw / 80KB gzip
`vite.config.js:5-58` — zero `build.rollupOptions.output.manualChunks`. The sole entry chunk `dist/assets/index-*.js` (248KB / 80KB gzip) packs **React 19 + react-dom + the entire app shell + all of App.jsx's static deps**.
**Cost:** ~80KB gzipped must parse/execute before first interactive on a mid-range phone. React is ~45-50KB of that and never changes between deploys — it should be a stable `react`/`react-dom` vendor chunk.
**Fix:** `manualChunks: { react: ['react','react-dom'] }`. Biggest single bundle win; better cache invalidation.

### P2 — Onboarding lazy chunk is 126KB and pulls OnboardJS pre-rc core
`dist/assets/Onboarding-*.js` = 126KB, gzip ~44KB. Embeds `@onboardjs/core` (`^1.0.0-rc.4` — a pre-release, likely not tree-shakeable) plus 6 onboarding steps. It's lazy, so it only costs the first-run user (the cold path on a new device).
**Impact:** ~44KB gz parse on first-run only. Acceptable; the rc dependency is a bundle smell.

### P3 — Fonts: 47 files / 610KB, unicode-range-lazy but no preload, all precached
- `src/main.jsx:4-13` imports **10 weight/face variants** across 4 families (Inter 400/500/600, Playfair 600/700/900, Fraunces 400/600, JetBrains Mono 400/600). Expands at build to **47 `@font-face` rules** — every subset for each weight.
- `font-display:swap` (no FOIT) + `unicode-range` (browser only downloads matching subset — good).
- **Problem:** `index.html` has **no `<link rel="preload">`**. Fonts are discovered only via CSS (deferred behind the module script) → text renders in fallback, then swaps → **noticeable FOUT** on first paint.
- **Problem:** `vite.config.js:55` precaches `**/*.{...woff2}` → all 47 files (~610KB) written to SW pre-cache on install; storage bloat for subsets never rendered (greek/cyrillic/vietnamese).
**Fix highest-ROI:** import only `latin` subsets (fontsource supports `@fontsource/inter/latin-400.css`) or exclude non-latin from the precache; preload the 2-3 latin faces actually used.

### P4 — `useSeason` computed twice and re-runs filter on every toggle
- `src/App.jsx:61` calls `useSeason(profile)` for the badge; `SeasonScreen.jsx:34` again. Duplicate derivation (trivial — 4-7 tasks).
- `src/hooks/useSeason.js:37-41` filters by `experience` + `completedCount`. `completedCount` = `completedTaskIds.size`, so **every checkbox toggle changes the dep → recompute + new `tasks` identity → re-render**. With 4-7 items this is microseconds; **do not optimize** — memoization is correct, data is tiny.

### P5 — Contexts re-render broadly, but infrequently
- `ThemeContext.jsx:33` / `LanguageContext.jsx:34` provide fresh value objects per provider render. 25 consumers of `useLanguage`, 13 of `useTheme`. A locale/theme change re-renders the whole subtree.
- **Mitigation:** both only re-render on their own rare state change. `t` is `useCallback([locale])`-stable. Acceptable; don't preemptively split.

### P6 — Hot-path task rendering is well done
`TaskCard` is `memo`'d with an explicit comparator (`TaskCard.jsx:164-168`) ignoring `onToggle`/task identity, keying only on `id/isChecked/checkedDate`. SeasonScreen recreates arrow closures per render but the comparator neutralizes them. Lists are 4-7 rows — virtualization not needed; `InspectionTab` caps at `MAX_VISIBLE = 5` (`InspectionTab.jsx:8,123`) with stable keys. **No hot-path list problem.**

### P7 — Startup / first paint blockers
- CSP in `index.html:5-6` strict, `script-src 'self'` — fine.
- `main.jsx:17-18` adds two pinch-zoom-blocking listeners — fine for a mobile PWA.
- Vite injects module script + stylesheet only — no preconnect/preload. PWA registration deferred (non-blocking), `immediate:true` — good.
**Impact:** only real first-paint costs are the 80KB entry parse (P1) + FOUT (P3).

---

## Would this jank on a mid-range phone?

**No.** Lists are 4-7 rows; `TaskCard` memoization correct; contexts mutate rarely; no O(n²) anywhere. The 80KB entry parse is a one-time startup tax, not interactive jank. The only *visible* artifact is first-load **FOUT**, which reads as "slow" but not "broken."

## Where the biggest wins are

| Fix | Est. saving |
|---|---|
| Split React into a `manualChunks` vendor chunk | better cache invalidation; ~45KB gz stable-cached |
| Import only `latin` font subsets + drop non-latin from SW precache | ~300-400KB storage + faster font resolution |
| `<link rel=preload>` on the 2-3 actually-used latin faces | kills FOUT first-paint |
| (small) Skip duplicate `useSeason` in AppContent | 1 redundant filter, negligible |

---

## Performance posture verdict

**7.5/10** — tiny lists + correct memoization mean zero runtime jank; the slow-footprint is bundle/font weight on first load and after-install storage, not interaction. Priority is bundle splitting + font subsetting, not hot-path tuning.
