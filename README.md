# Apiario 🐝

A progressive web app for beginner beekeepers. Delivers seasonal task guidance, a guided hive diagnosis wizard, an inspection journal, and a curated knowledge library — no internet required after the first load.

**Live:** https://paaaddy.github.io/apiario/

---

## Features

- **Season tab** — weekly task cards filtered by your experience level, with checkboxes that log completed tasks. Hidden "secret" tasks unlock as you check things off; in winter a climate-aware panel shows target honey stores (kg) for your zone, and northern/mediterranean climate zones shift the season boundaries by ±2 weeks.
- **Diagnose tab** — branching wizard covering queen issues, varroa, disease, swarming, and more; pre-routes from your last hive inspection automatically
- **Inspect tab** — standalone inspection journal across all colonies: queen status, varroa count, brood pattern, honey stores, queen introduction year, and harvest (kg)
- **Learn tab** — bilingual knowledge library backed by verified sources (varroa thresholds, AFB ropiness test, honey moisture, and more), with search and difficulty levels
- **My Hive tab** — four sub-tabs: Colonies (named hives with add/edit/delete; tap a hive to drill into a detail view with trend sparklines and total harvest), Inspections, Log (activity history + custom entries), and Profile
- **Data & backup** — export your data as a JSON file or restore it from one; privacy-first onboarding step explains that all data lives on-device only (no accounts, no cloud)
- **Three visual themes** — Honeycomb (default), Field Notebook, and Seasonal Light; switch in My Hive → Profile, persisted across sessions
- **DE / EN toggle** — full German and English support, switch instantly in any screen
- **Offline-first** — works with no signal after the first visit; all content and fonts are precached, storage is protected from browser eviction
- **Installable** — add to home screen on Android and iOS (PWA); the app icon badge shows how many urgent/important tasks are still open
- **Hands-free mode** — floating bee button activates voice control via Web Speech API, including opening the Inspect and Learn tabs

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS 3 |
| Offline | vite-plugin-pwa + Workbox |
| Onboarding | @onboardjs/react |
| Fonts | @fontsource (self-hosted, precached) |
| State | React context + localStorage |
| Voice | Web Speech API |
| Tests | Vitest + Testing Library (315 tests, 40 files) |
| Deploy | GitHub Actions → GitHub Pages |

---

## Development

```bash
npm install
npm run dev              # http://localhost:5173
npm run dev -- --host    # expose on local network
npm run test:run         # run all tests (315 tests, 40 files)
npm run build            # production build
npm run lint             # ESLint
```

Add `?debug` to any URL in dev mode to open the debug panel (localStorage inspector + reset buttons).

---

## Content

All content lives in bundled JSON files — no server needed:

- `src/data/seasons.json` — seasonal tasks for spring / summer / autumn / winter, bilingual (DE/EN), with secret-task unlock levels
- `src/data/diagnosis.json` — branching diagnosis tree, bilingual (DE/EN)
- `src/data/knowledge.json` — learn-library facts, bilingual (DE/EN), sourced from verified references (see `docs/research/beekeeping-facts.md`)
- `src/i18n/strings.js` — all UI strings, bilingual

---

## Architecture

See [CLAUDE.md](CLAUDE.md) (and its harness-agnostic mirror [AGENTS.md](AGENTS.md)) for a full description of the app architecture, data model, theming system, and testing conventions.

---

## License

MIT — see [LICENSE](LICENSE) for the full text.