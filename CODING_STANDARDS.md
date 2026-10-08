# Review standards

Review the frozen packet and its supplied issue/spec, then inspect relevant surrounding source. Report missing evidence as a limitation, not a clean diff review.

- Cross-consumer consistency: history, Colony summaries, Next actions and Diagnosis must agree on Inspection chronology, including ambiguous timestamps. Shared ordering belongs at the existing utility seam.
- Persistence safety: migrations, ordinary writes and backup restore must agree on validation and retention; preserve recoverable data and expose failed durable writes.
- Interaction lifetime: navigation handoffs are consumed once; feedback is transient and remains accurate when dates or targets change.
- Compatibility: match surrounding interfaces, naming and theme behavior; verify de/en text and all applicable themes rather than introducing parallel patterns.

Mechanical checks belong in ESLint/tests/CI, not additional prose rules. Use `docs/agents/app-reference.md` for theme tokens and provider setup; current configuration and source override cached descriptions.
