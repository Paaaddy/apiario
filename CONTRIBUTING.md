# Contributing to Apiario

## Setup

```bash
git clone https://github.com/paaaddy/apiario.git
cd apiario
npm install
npm run dev
```

App runs at `http://localhost:5173`. Add `?debug` in dev mode to open the debug panel.

## Tests

```bash
npm run test:run   # run once
npm test           # watch mode
```

## Lint

```bash
npm run lint
```

## Submitting changes

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-change`
3. Make changes with tests where applicable
4. Ensure `npm run test:run` and `npm run lint` pass
5. Open a pull request against `master`

## Architecture notes

See [CLAUDE.md](CLAUDE.md) for a full description of the app architecture, data model, and theming system.
