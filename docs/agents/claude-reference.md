# Claude workflow reference

AGENTS.md is the shared entry point. App architecture, commands, styling and testing live in `docs/agents/app-reference.md`; source and configuration are authoritative.

## gstack

This repo uses [gstack](https://github.com/paaaddy/gstack) skills for planning, review, QA, and shipping. Invoke any skill with `/<skill-name>`.

### When to use `/browse`

Reach for `/browse` whenever you need to **see** the app — manual QA of a flow, verifying a deploy on https://apiario.pages.dev/, capturing before/after screenshots for a design change, or producing repro evidence for a bug. For multi-step user flows or auth, pair with `/setup-browser-cookies`.

### Use `/guard` for risky work

Before touching production, debugging live systems, running migrations, or doing anything destructive, enable `/guard` (combines `/careful` + `/freeze`). It warns on `rm -rf`, `DROP TABLE`, force-push, `git reset --hard`, etc., **and** scopes edits to the directory you're working in. For just one of the two, use `/careful` (warnings only) or `/freeze` (scope only). Clear with `/unfreeze` when done.

## Agent skills

### Issue tracker

GitHub Issues (Paaaddy/apiario), via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
