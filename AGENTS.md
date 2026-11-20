# Agent guide

Apiario is an offline-first, bilingual (de/en) beekeeping PWA without a backend.

- Shell: cwd is the repo root; run commands without a `cd` prefix. Wait on CI with `gh pr checks <n> --watch`, never `sleep`.
- Verification: `npm run verify` runs lint, tests, timezone regressions and the Cloudflare root build to completion. Report success only after exit 0; retain failure output. Use `npm run test:run -- <file>` for focused tests, not watch mode.
- Before moving machines or deleting a clone: `npm run repo:state` lists commits, worktrees, stashes and changes that exist only locally.
- Parallel implementation or independent PR verification: read `docs/agents/execution.md` before dispatch. Each writer gets a separate worktree; reviews receive a frozen diff packet including untracked files.
- State, screens, theme tokens, provider test wrappers and offline behavior: consult `docs/agents/app-reference.md` when changing those areas; check current source/config before relying on cached details.
- Domain terminology and architectural decisions: read `GLOSSARY.md`, `docs/agents/domain.md` and relevant `docs/adr/` entries before changing domain behavior.
- GitHub issues: read `docs/agents/issue-tracker.md`.
- Review: apply `CODING_STANDARDS.md`. User-facing text goes through `strings.js` and `t()` — enforced by the `i18n/no-hardcoded-ui-text` ESLint rule, not by review; styling uses existing Tailwind tokens. Keep public hook APIs and co-located tests compatible.
- Deployment: master pushes target Cloudflare Pages; trusted PRs get previews. GitHub Pages remains available for migration until owner-approved retirement. Read `docs/cloudflare-pages.md` for setup, go-live and data migration. Verify locally before pushing. Commands live in `package.json`, CI in `.github/workflows/`, hooks in `hooks/` (installed by `npm install` via `prepare`).
- Skill selection and Claude-specific workflows: `docs/agents/claude-reference.md`.
