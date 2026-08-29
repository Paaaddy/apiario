# Git hooks

This repo ships a shared `pre-commit` hook that enforces quality on every
commit: it runs `npm run lint` and `npm run test:run` (tests in CI mode) and
**blocks the commit** if either fails.

The hook lives in version control (`hooks/`) so it's shared across every
harness and every clone — Claude, Codex, Cursor, plain `git`, etc.

## Enable on a fresh clone

Git doesn't run hooks from this directory by default. Point Git at it once,
per clone:

```sh
git config core.hooksPath hooks
```

That's it. After this, `git commit` automatically runs the pre-commit hook.

## What it does

1. `npm run lint` — ESLint over the whole repo.
2. `npm run test:run` — Vitest in CI (non-watch) mode.

If either command exits non-zero, the commit is aborted with a clear message.

## Notes

- When `npm`/`node` aren't installed, or `node_modules` hasn't been set up
  (`node_modules/.bin` missing), the hook prints a warning and does **not**
  block — so a fresh clone without dependencies can still commit. Run
  `npm install` and then `npm run lint` / `npm run test:run` yourself in that
  case.
- Requires no extra npm dependencies (no husky / lefthook / lint-staged).
- Written in POSIX-compatible shell.

## Disable (temporarily)

```sh
git config --unset core.hooksPath
```
