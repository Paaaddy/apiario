# Agent guide

Apiario is an offline-first, bilingual (de/en) beekeeping PWA without a backend.

- Verification: `npm run verify` runs lint, tests, timezone regressions and the Pages build to completion. Report success only after exit 0; retain failure output. Use `npm run test:run -- <file>` for focused tests, not watch mode.
- Parallel implementation or independent PR verification: read `docs/agents/execution.md` before dispatch. Each writer gets a separate worktree; reviews receive a frozen diff packet including untracked files.
- State, screens, theme tokens, provider test wrappers and offline behavior: consult `docs/agents/app-reference.md` when changing those areas; check current source/config before relying on cached details.
- Domain terminology and architectural decisions: read `CONTEXT.md`, `docs/agents/domain.md` and relevant `docs/adr/` entries before changing domain behavior.
- GitHub issues: read `docs/agents/issue-tracker.md`.
- Review: apply `CODING_STANDARDS.md`. User-facing text uses `{ de, en }`; styling uses existing Tailwind tokens. Keep public hook APIs and co-located tests compatible.
- Deployment: master pushes deploy to Pages; there is no staging. Verify locally before pushing. Commands live in `package.json`, CI in `.github/workflows/`, hooks in `hooks/`.
- Skill selection and Claude-specific workflows: `docs/agents/claude-reference.md`.
