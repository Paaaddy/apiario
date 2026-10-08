# Isolated execution and evidence

## Parallel work

Create one worktree per writer or independent PR verification:

```bash
npm run agent:worktree -- /tmp/opencode/apiario-task HEAD
```

Pass the printed absolute directory and resolved commit to the agent. Set every tool's working directory there; OpenCode can use `session_move` when the new tree is the session's primary directory. Install dependencies in that tree with `npm ci`. This creates a detached tree, preserving the original working directory and all existing changes. Commit in the task tree and integrate deliberately; never reset the shared tree.

Uncommitted source changes are not copied by this command. If a task depends on WIP, first agree on a checkpoint commit or explicitly transfer and verify the required patch in its isolated tree. A shared-file handoff is complete only after the receiving agent has the exact revision and the previous writer has stopped.

## Review without shell permissions

The coordinator generates an immutable review input before dispatch:

```bash
npm run agent:review-packet -- <base-commit> /tmp/opencode/apiario-review.diff
```

The packet includes tracked changes against the resolved base, source contents of non-ignored untracked files, working-tree status and revision metadata. Inspect it for secrets/user-owned material before sharing. Supply the packet path (or its contents), issue/spec, standards paths, and snapshot source directory to the reviewer. Snapshot reviewers' source in a separate worktree if writers are still active. Reviewers need file-read access, not shell or nested delegation. If the packet cannot be read, report the blocked review rather than substituting source inspection for diff coverage.

## Verification completion

Run `npm run verify` in the foreground in the target tree. It waits for every check, prints each exit status and returns nonzero if any check fails. For PR evidence, record the exact revision, command, terminal exit and test totals. A background process is pending, never passed; if background execution is necessary, collect its completion notification and terminal outcomes before the final report.

CI and pre-commit also run timezone regressions. Existing subprocess tests enforce Berlin and Los Angeles regardless of host timezone; the additional matrix runs the entire chronology test file under both zones. Mocking a clock alone does not test timezone semantics.
