# Cloudflare Pages deployment

The target is **https://apiario.pages.dev/**, in the same Cloudflare account as
Voltru. Source and CI remain on GitHub. No backend or cloud data storage is added.
Repository changes alone do not activate hosting; complete the account setup first.

## One-time account setup

1. In Voltru's Cloudflare account, create a **Pages Direct Upload** project named
   `apiario`, with production branch **`master`**. Use Pages, not Workers, and do
   not connect Cloudflare's automatic Git builds: GitHub Actions owns verification
   and deployment. CLI alternative after authentication:
   `npx wrangler@4 pages project create apiario --production-branch master`.
2. Inspect the project's assigned hostname. Cloudflare can append a suffix when
   a name is already taken. It must be exactly **`apiario.pages.dev`**. If not,
   stop and consult the owner; do not substitute a hostname.
3. Create an API token with **Account → Cloudflare Pages → Edit**, scoped to this
   account only. This permission is account-wide within Pages; do not use a global
   API key or add unrelated permissions. Keep the token out of chat and files.
4. In GitHub repository **Settings → Secrets and variables → Actions**, add
   `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as repository secrets.
   Configure the `cloudflare-production` and `cloudflare-preview` environments
   to permit `master` and same-repository PR deployments respectively. Protect
   changes to deployment workflows through review. Same-repository branch writers
   are trusted; fork and Dependabot PRs only run verification, without previews.
5. Run **Deploy to Cloudflare Pages** on
   `master` (or push to `master`). Keep the required PR check named `build`.

## Deployment behavior

- Every push to `master`, PR targeting `master`, and manual dispatch runs CI.
  There are no path filters that could leave a required check pending.
- `build` installs dependencies, audits production dependencies, then runs
  `npm run verify`: lint, tests, both timezone regressions, and the root build.
- The verified `dist` artifact is uploaded to Cloudflare by a separate job.
  That job does not check out PR source or install the app with credentials.
  Before upload, it validates the project hostname and production branch via API.
  Within each deployment queue, it checks the current source SHA and skips
  superseded production/PR runs.
- Production uses `--branch=master`. Trusted PRs use `--branch=pr-<number>`;
  the deployment URL appears in the GitHub environment and job summary.
  Manual dispatch from a non-master ref verifies but does not deploy;
  `release.yml` relies on this to give the release PR its `build` check.
- The build contains the generated service worker, precached assets/fonts and
  relative manifest shortcuts. Preview origins have separate storage too.

## Go-live checks

Local verification:

```sh
npm run verify
```

After CI deploys, check `https://apiario.pages.dev/` on a fresh browser profile:
onboarding, all tabs, JSON restore/export, themes and DE/EN. Install the PWA and
test offline after its first online load. Check manifest shortcuts and asset/SW
URLs resolve under `/`. Check a trusted PR preview does not replace production.

## Retired GitHub Pages deployment

The owner approved retiring `paaaddy.github.io/apiario/`
([#157](https://github.com/Paaaddy/apiario/issues/157)): GitHub Pages ignores
`public/_headers`, so that origin served no security headers. Nothing deploys to
it any more. Unpublishing the site is a manual step in **Settings → Pages**.

Browser data is tied to an origin, so data saved at the old address does not move
to the new one. A JSON Backup exported there can still be imported during
onboarding or under **My Hive → Profile → Data & backup**.

## References

- [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Direct Upload with CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Backup safety](backup-safety.md)
