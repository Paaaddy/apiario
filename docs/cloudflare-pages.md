# Cloudflare Pages deployment and migration

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
   stop and consult the owner; do not substitute a hostname or publish the notice.
3. Create an API token with **Account → Cloudflare Pages → Edit**, scoped to this
   account only. This permission is account-wide within Pages; do not use a global
   API key or add unrelated permissions. Keep the token out of chat and files.
4. In GitHub repository **Settings → Secrets and variables → Actions**, add
   `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as repository secrets.
   Configure the `cloudflare-production` and `cloudflare-preview` environments
   to permit `master` and same-repository PR deployments respectively. Protect
   changes to deployment workflows through review. Same-repository branch writers
   are trusted; fork and Dependabot PRs only run verification, without previews.
5. After the migration changes are merged, run **Deploy to Cloudflare Pages** on
   `master` (or push to `master`). Keep the required PR check named `build`.
   GitHub Pages must remain enabled with GitHub Actions as its publishing source.

## Deployment behavior

- Every push to `master`, PR targeting `master`, and manual dispatch runs CI.
  There are no path filters that could leave a required check pending.
- `build` installs dependencies, audits production dependencies, then runs
  `npm run verify`: lint, tests, both timezone regressions, and the root build.
- The verified `dist` artifact is uploaded to Cloudflare by a separate job.
  That job does not check out PR source or install the app with credentials.
  Before upload, it validates the project hostname and production branch via API.
- Production uses `--branch=master`. Trusted PRs use `--branch=pr-<number>`;
  the deployment URL appears in the GitHub environment and job summary.
  Manual dispatch from a non-master ref verifies but does not deploy.
- A separate build uses `/apiario/`, output `dist-legacy`, and
  `VITE_LEGACY_HOST=true`. It contains the bilingual migration notice. GitHub
  Pages receives it **only after Cloudflare deployment succeeds**, so an account
  setup failure leaves the old live site untouched. Root builds omit the notice.
- Both builds retain the generated service worker, precached assets/fonts and
  relative manifest shortcuts. Preview origins have separate storage too.

## Go-live checks

Local verification:

```sh
npm run verify
VITE_LEGACY_HOST=true npm run build -- --base /apiario/ --outDir dist-legacy
```

After CI deploys, check `https://apiario.pages.dev/` on a fresh browser profile:
onboarding, all tabs, JSON restore/export, themes and DE/EN. Install the PWA and
test offline after its first online load. Check manifest shortcuts and asset/SW
URLs resolve under `/`, with no `/apiario/` requests. Check a trusted PR preview
does not replace production. Confirm the old URL still opens and exports data,
and its migration notice switches between German and English.

## Existing users: export before moving

Browser data, caches, persistence permissions and installed PWAs are tied to an
origin. The new app cannot read data at the GitHub Pages origin. There is no
automatic redirect or automatic transfer.

**English:** Open the old app → **My Hive → Profile → Data & backup** and export
JSON. Open the new app and import during onboarding or in the same profile
section. Import replaces destination data, so back up any data already created
there first. Check colonies, inspections and activity history before removing
the old installed app. Install from the new address and choose language/theme
again. Keep the backup file.

**Deutsch:** Öffne die alte App → **Mein Stock → Profil → Datensicherung** und
exportiere die JSON-Datei. Importiere sie in der neuen App beim Einstieg oder
im Profil. Der Import ersetzt dort vorhandene Daten; sichere neue Einträge
vorher separat. Prüfe Völker, Kontrollen und Verlauf, bevor du die alte
installierte App entfernst. Installiere die App von der neuen Adresse erneut
und wähle Sprache und Design neu. Bewahre die Sicherungsdatei auf.

Retire GitHub Pages only after the owner's explicit approval. Until then, keep
the legacy build/job and old-origin data export accessible. A rollback of hosting
does not move or merge data between origins; export separately from each origin.

## References

- [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Direct Upload with CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Backup safety](backup-safety.md)
