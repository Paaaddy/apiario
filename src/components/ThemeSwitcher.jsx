import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'

const THEMES = [
  { key: 'a', de: 'Honigwabe', en: 'Honeycomb', icon: '🍯' },
  { key: 'b', de: 'Notizbuch', en: 'Field Notebook', icon: '📔' },
  { key: 'c', de: 'Saisonal', en: 'Seasonal Light', icon: '🌸' },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { locale } = useLanguage()

  return (
    <div className="mb-6">
      <h3 className="font-serif text-sm font-semibold text-brown-mid uppercase tracking-widest mb-2">
        {locale === 'de' ? 'Design' : 'Design'}
      </h3>
      <div className="flex flex-col gap-2">
        {THEMES.map(({ key, de, en, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center gap-2 ${
              theme === key
                ? 'bg-honey border-honey-dark text-brown'
                : 'bg-white border-amber-100 text-brown-mid'
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{locale === 'de' ? de : en}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
