import { useLanguage } from '../hooks/useLanguage'

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="flex rounded-full border border-brown/20 overflow-hidden text-xs font-semibold">
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
