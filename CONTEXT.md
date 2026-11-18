# Apiario

Apiario helps beginner beekeepers plan seasonal work, record colony observations, and reason about hive health without a backend.

## Language

**Colony**:
A managed bee colony in the beekeeper's apiary, identified by a name and optional notes.
_Avoid_: Hive when referring to the tracked living colony rather than the physical box.

**Inspection**:
A dated observation of one colony, including queen status, brood, stores, population, temperament, treatment, harvest, and notes when recorded.
_Avoid_: Checkup, visit, control.

**Colony record**:
One colony together with its derived inspection history and metrics.
_Avoid_: Colony view, hive summary.

**Backup**:
A user-owned export file containing Apiario data that can be restored into the app.
_Avoid_: Data port, dump.

**Diagnosis flow**:
A guided path from observed colony symptoms to a suggested outcome and actions.
_Avoid_: Diagnosis screen, wizard.

**Next action**:
A recommended colony or seasonal task surfaced from Apiario's existing records and guidance.
_Avoid_: Next best action, recommendation, prompt.

**Season guidance**:
The tasks, climate hints and Next actions that apply to one profile on a given date. Browsing another week changes its tasks, hints and seasonal Next action; overdue-inspection thresholds and the app badge count stay anchored on today.
_Avoid_: Season view, season data.

**Inspection draft**:
The not-yet-saved values of an Inspection while the beekeeper fills in or edits it. A draft either becomes a recorded Inspection or is rejected with a reason; it never silently drops a value.
_Avoid_: Form state, payload.
