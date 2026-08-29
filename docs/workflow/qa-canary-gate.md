# QA + Canary pre/post-deploy gate

Formalizes the existing `/qa` (pre-deploy) and `/canary` (post-deploy) gstack skills
into the ship/deploy loop. These tools are already installed — this doc is the
operator playbook for when to run them. Status: **DRAFT**.

> Deploy model: pushes to `master` → GitHub Actions builds (`--base /apiario/`) →
> GitHub Pages at <https://paaaddy.github.io/apiario/>. **No staging env.**
> Both gates happen local (dev server) and against the live Pages URL.

---

## 1. Before deploy — QA gate (local)

Run against the **local dev server**, not prod.

1. Start the dev server: `npm run dev` (add `-- --host 0.0.0.0` to expose on LAN,
   e.g. for testing on a real phone/tablet at `http://<device-ip>:5173`).
2. Run `/qa` against the local server. If it finds bugs, use its **auto-fix loop**
   to patch them and re-verify.
3. Prefer `/qa-only` for a report-first pass (log issues, fix manually).
4. For quick visual spot-checks during the loop, pair `/browse` (headless,
   ~100ms/command) to verify layout/interactions cheaply.

**The pre-deploy checklist (all must pass):**

- [ ] `npm run lint`     — no lint errors (a pre-commit hook also enforces this)
- [ ] `npm run test:run` — full test suite passes
- [ ] `/qa` clean        — automated QA finds no high/critical issues
- [ ] If touching anything risky/prod-adjacent, enable `/guard`
      (`/careful` + `/freeze`) so fixes stay scoped to your files.

Only proceed when the checklist is green.

## 2. Ship

1. `/ship` — bumps VERSION, updates CHANGELOG, opens the PR.
2. `/land-and-deploy` — merges the PR, waits for CI, and verifies the deploy
   lands on GitHub Pages.

---

## 3. After deploy — Canary gate (live)

Run `/canary` against the **live URL** across a few minutes after deploy lands.

> GitHub Pages is a **static site** — there is no running server or health-check
> endpoint to curl. Tailor canary to the static-surface checks that still apply:

- **Page loads 200** — no 404s, no failed chunk/asset requests.
- **No console errors** — watch for runtime errors, failed fetches, uncaught
  exceptions on load and interaction.
- **Core Web Vitals within baseline** — compare LCP/CLS/TBT against the pre-deploy
  baseline; flag regressions.
- **Visual baseline** — diff the live pages against pre-deploy screenshots from the
  QA gate (`/browse` / `/canary` captures) to catch layout/theme regressions.
- Optional: also spot-check `/qa` flows against the live URL after deploy.

Because it's a PWA, account for the service worker: freshly precached assets only
take effect on the next load a client checks for an update — re-load once or twice to
confirm the new SW version is live.

---

## 4. Gate / flow

```
pre-deploy QA ──pass──▶ /ship ──▶ /land-and-deploy ──▶ deploy ──▶ canary
     │                          (merge + GitHub Pages)          │
     │fail (fix, /qa re-run)                                    │pass → done
     └───────────────────────────────────────────────◀────────┘
                                                          fail → follow-up fix
```

| Gate | Pass | Fail → action |
|------|------|---------------|
| lint + test | continue | fix locally, re-run |
| `/qa` local | continue | use auto-fix loop, re-run `/qa` |
| canary live | done | push follow-up fix (auto-redep) |

## 5. Rollback

There is no staging or version rollback on GitHub Pages: **rollback = push a fix**.
If canary flags a regression:

1. Open a follow-up fix (or revert commit).
2. Push to `master` — GitHub Actions rebuilds and auto-redeploys Pages.
3. Re-run `/canary` against the live URL to confirm the baseline is restored.

The Pages deployment itself is only replaced by the next successful build, so the
fix commit *is* the rollback mechanism.
