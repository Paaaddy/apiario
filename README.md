# Apiario 🐝

A progressive web app for beginner beekeepers. Delivers seasonal task guidance and a guided hive diagnosis wizard — no internet required after the first load.

**Live:** https://paaaddy.github.io/apiario/

---

## Features

- **Season tab** — weekly task cards filtered by your experience level, with checkboxes that log completed tasks
- **Diagnose tab** — branching wizard covering queen issues, varroa, disease, swarming, and more; pre-routes from your last hive inspection automatically
- **My Hive tab** — four tabs: Colonies (named hives with add/edit/delete), Inspections (queen status, varroa counts, brood pattern per colony), Log (activity history), and Profile
- **Hive inspection journal** — log inspections per colony with structured fields; shortcut from the colony list; links directly into the diagnosis wizard
- **Three visual themes** — Honeycomb (default), Field Notebook, and Seasonal Light; switch in My Hive → Profile, persisted across sessions
- **DE / EN toggle** — full German and English support, switch instantly in any screen
- **Offline-first** — works with no signal after the first visit; all content and fonts are precached
- **Installable** — add to home screen on Android and iOS (PWA)
- **Hands-free mode** — floating bee button activates voice control via Web Speech API

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS 3 |
| Offline | vite-plugin-pwa + Workbox |
| Onboarding | @onboardjs/react |
| Fonts | @fontsource (self-hosted, precached) |
| State | React context + localStorage |
| Voice | Web Speech API |
| Tests | Vitest + Testing Library (215 tests) |
| Deploy | GitHub Actions → GitHub Pages |

---

## Development

```bash
npm install
npm run dev              # http://localhost:5173
npm run dev -- --host    # expose on local network
npm run test:run         # run all tests (215 tests, 27 suites)
npm run build            # production build
npm run lint             # ESLint
```

Add `?debug` to any URL in dev mode to open the debug panel (localStorage inspector + reset buttons).

---

## Content

All content lives in two bundled JSON files — no server needed:

- `src/data/seasons.json` — seasonal tasks for spring / summer / autumn / winter, bilingual (DE/EN)
- `src/data/diagnosis.json` — branching diagnosis tree, bilingual (DE/EN)
- `src/i18n/strings.js` — all UI strings, bilingual

---

## Architecture

See [CLAUDE.md](CLAUDE.md) for a full description of the app architecture, data model, theming system, and testing conventions.

---

## License

MIT
