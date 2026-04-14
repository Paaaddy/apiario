# Apiario 🐝

A progressive web app for beginner beekeepers. Delivers seasonal task guidance and a guided hive diagnosis wizard — no internet required after the first load.

**Live:** https://paaaddy.github.io/apiario/

---

## Features

- **Season tab** — weekly task cards filtered by your experience level, with checkboxes that log completed tasks
- **Diagnose tab** — branching wizard covering queen issues, varroa, disease, swarming, and more
- **My Hive tab** — edit your profile (hive count, climate zone, experience) and view your activity log
- **DE / EN toggle** — full German and English support, switch instantly in any screen
- **Offline-first** — works with no signal after the first visit; all content and fonts are precached
- **Installable** — add to home screen on Android and iOS (PWA)
- **Hands-free mode** — floating bee button activates voice control via Web Speech API

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Offline | vite-plugin-pwa + Workbox |
| Fonts | @fontsource (self-hosted, precached) |
| State | React context + localStorage |
| Voice | Web Speech API |
| Tests | Vitest + Testing Library |
| Deploy | GitHub Actions → GitHub Pages |

---

## Development

```bash
npm install
npm run dev              # http://localhost:5173
npm run dev -- --host    # expose on local network
npm run test:run         # run all tests
npm run build            # production build
```

Add `?debug` to any URL to open the debug panel (localStorage inspector + reset buttons).

---

## Content

All content lives in two bundled JSON files — no server needed:

- `src/data/seasons.json` — seasonal tasks for spring / summer / autumn / winter, bilingual (DE/EN)
- `src/data/diagnosis.json` — branching diagnosis tree, bilingual (DE/EN)
- `src/i18n/strings.js` — all UI strings, bilingual

---

## License

MIT
