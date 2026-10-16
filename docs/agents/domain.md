# Domain Docs

## Before exploring

- Read `CONTEXT.md` at the repo root.
- Read relevant decisions under `docs/adr/`.

If these files are absent, proceed silently. Domain modeling creates
documentation lazily when terms or decisions are resolved.

## Layout

This is a single-context repository:

- `CONTEXT.md`: domain vocabulary.
- `docs/adr/`: architecture decisions.

## Use the domain vocabulary

Use terms defined in `CONTEXT.md` when naming concepts in code, tests,
issues, and proposals. Respect its explicitly avoided synonyms.

If a needed concept is missing, reconsider the term or note the gap
for domain modeling.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, identify the decision and
explain why it should be reopened rather than silently overriding it.
