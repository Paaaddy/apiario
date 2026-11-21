import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

// Colors come from the per-theme --theme-lang-* tokens in index.css, so the
// switch paints its own opaque surface and keeps >= 4.5:1 on any header
// behind it. The buttons have a real 44px minimum width: they sit side by
// side, so an invisible hit-area extension would overlap its neighbour.
const BASE = 'min-w-11 px-2.5 py-1 text-center transition-colors first:rounded-s-full last:rounded-e-full'

function style(active) {
  return active
    ? { background: 'var(--theme-lang-active-bg)', color: 'var(--theme-lang-active-fg)' }
    : { background: 'var(--theme-lang-bg)', color: 'var(--theme-lang-fg)' }
}

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t(s.lang_group_label)}
      className="shrink-0 flex rounded-full border text-xs font-semibold"
      style={{ borderColor: 'var(--theme-lang-fg)' }}
    >
      <button onClick={() => setLocale('de')} className={BASE} style={style(locale === 'de')} aria-pressed={locale === 'de'}>
        DE
      </button>
      <button onClick={() => setLocale('en')} className={BASE} style={style(locale === 'en')} aria-pressed={locale === 'en'}>
        EN
      </button>
    </div>
  )
}
