import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div role="group" aria-label={t(s.lang_group_label)} className="shrink-0 flex rounded-full border border-brown/20 overflow-hidden text-xs font-semibold">
      <button
        onClick={() => setLocale('de')}
        className={`px-2.5 py-1 transition-colors ${
          locale === 'de' ? 'bg-honey-dark text-white' : 'text-brown/40'
        }`}
        aria-pressed={locale === 'de'}
      >
        DE
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 transition-colors ${
          locale === 'en' ? 'bg-honey-dark text-white' : 'text-brown/40'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  )
}
