# Backup and local-save safety

Apiario stores records on this device. A Backup is a user-owned JSON export, not
a cloud copy. Keep exports somewhere safe outside the browser.

## Unsaved changes

If a storage write fails, a persistent notice identifies the changes as unsaved.
They remain available in the current app session. Keep the app open, resolve the
browser's storage restriction, and select **Retry saving**. The notice disappears
only when every failed record collection has been saved. Reloading before retry
can lose these in-memory changes.

## Import validation

Open **My Hive → Profile → Data & backup** to restore a Backup. Validation happens
before replacing any record collection:

- The `apiario-backup` envelope supports versions 1 and 2 and the legacy envelope
  without a version. Unsupported versions and malformed supplied collections are
  rejected; omitted optional collections retain the established empty defaults.
- Colony, Inspection, and task-log records are checked for safe field types,
  identifiers, enums/scales, and ownership. Identifiers must be unique within each
  collection. Ownership is checked against the same profile migration used by
  loading, including legacy seeded Colonies.
- Structurally safe invalid-dated Inspections are retained, not silently repaired
  or deleted. Inspection chronology excludes them from latest selection and dated
  metrics. Valid future dates remain accepted.
- Unknown additive fields are retained. Malformed supplied fields are not
  silently replaced with empty data.

Resource limits are checked without truncating the user's Backup:

| Limit | Reason |
| --- | --- |
| 5 MiB of UTF-8 JSON | Bound file reading, parsing, and preparation. Checked before reading a file and again against its decoded content. |
| 500 task-log entries | Match the existing log retention policy. |
| 500 Inspections per Colony | Match the existing Inspection retention policy. |
| 10,000 legacy auto-seeded Colonies | Prevent a tiny legacy `hiveCount` field from triggering unbounded migration allocations. |

The byte and legacy-seeding ceilings are import resource safeguards, not a new
product limit on ordinary Colony management. Passing validation does not
guarantee that a particular browser has enough storage available.

## Restore failures and recovery

Restoration first snapshots the exact prior storage values, including absent keys,
and serializes every incoming collection. If writing fails, it rolls back the
collections already written. Failed validation, reading, or preparation replaces
nothing. A successful restore alone requests a reload.

If rollback also fails, a persistent **Recover previous records** notice remains
available across tabs for the current session. Do not reload. Resolve the storage
restriction and select that action. A further failed recovery keeps the notice and
recovery snapshot available. New imports and exports are blocked while recovery
is pending; ordinary edits remain unsaved drafts until recovery completes, so
recovery cannot overwrite newer durable observations. Retry any unsaved edits
after recovering the prior records.

This is handled-failure recovery, **not** a database transaction. localStorage
cannot guarantee atomic multi-key writes under browser/process crashes. Recovery
information is held in memory for the current session, not exported with domain
records. A crash or reload during a failed recovery can lose that information.

## Maintainer verification

Use a lockfile installation, lint, the non-watch test suite, and the deployment-base
production build. The tests cover real application notices/actions, Backup
validation and rollback, persistence retry, and bundled Diagnosis flow validity.

Run both full and production-only dependency audits. Compatible patch updates fix
the `brace-expansion` and `fast-uri` advisories. The remaining `braces` advisory
propagates through Tailwind 3's build-tool dependencies; npm proposes a Tailwind 4
major migration. Review that separately rather than forcing it into this work.
