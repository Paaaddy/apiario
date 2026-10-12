import { useLanguage } from '../hooks/useLanguage'

const title = {
  de: 'Umzug zu Cloudflare Pages',
  en: 'Moving to Cloudflare Pages',
}
const instructions = {
  de: 'Deine Daten ziehen nicht automatisch um. Exportiere sie hier unter Mein Stock → Profil → Datensicherung. Öffne danach apiario.pages.dev und importiere die JSON-Datei beim Einstieg oder unter Profil → Datensicherung. Prüfe dort deine Daten, bevor du die alte App entfernst. Installiere die App von der neuen Adresse erneut. Sprache und Design musst du dort neu wählen. Diese alte App bleibt für den Export verfügbar.',
  en: 'Your data do not move automatically. Export them here under My Hive → Profile → Data & backup. Then open apiario.pages.dev and import the JSON file during onboarding or under Profile → Data & backup. Check your data there before removing the old app. Please reinstall the app from the new address. Choose your language and theme again there. This old app remains available for export.',
}
const link = { de: 'Neue App öffnen', en: 'Open the new app' }

export default function HostingMigrationNotice() {
  const { t } = useLanguage()
  if (import.meta.env.VITE_LEGACY_HOST !== 'true') return null

  return (
    <section aria-label={t(title)} className="shrink-0 max-h-48 overflow-y-auto border-b border-honey-dark bg-cream p-3 text-brown">
      <details>
        <summary className="cursor-pointer text-sm font-semibold">{t(title)}</summary>
        <p className="mt-2 text-sm">{t(instructions)}</p>
        <a href="https://apiario.pages.dev/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold underline">
          {t(link)}
        </a>
      </details>
    </section>
  )
}
