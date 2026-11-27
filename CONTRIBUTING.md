# Contributing to Apiario

## Setup

You need Node 22 (see `.nvmrc`; supported ranges are in `package.json` `engines`).

```bash
git clone https://github.com/paaaddy/apiario.git
cd apiario
npm install
npm run dev
```

`npm install` also enables the [pre-commit hook](hooks/README.md), which runs lint,
tests and the timezone regressions.

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
4. Ensure `npm run verify` passes. CI runs it as the required `build` check, alongside a production dependency audit and a secret scan
5. Open a pull request against `master`

## Architecture notes

See the [app reference](docs/agents/app-reference.md) for the app architecture, data model, and theming system.
