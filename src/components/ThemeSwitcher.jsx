import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'
import { getButtonStyle } from '../utils/themeButtonStyle'

const THEMES = [
  { key: 'a', de: 'Honigwabe', en: 'Honeycomb', icon: '🍯' },
  { key: 'b', de: 'Notizbuch', en: 'Field Notebook', icon: '📔' },
  { key: 'c', de: 'Saisonal', en: 'Seasonal Light', icon: '🌸' },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { locale } = useLanguage()

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: 'var(--theme-font-head, serif)', fontSize: 12, fontWeight: 600, color: 'var(--theme-ink-mid, #92400e)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 0 }}>
        Design
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {THEMES.map(({ key, de, en, icon }) => {
          const isActive = theme === key
          const btnStyle = getButtonStyle(theme, isActive)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s',
                ...btnStyle,
              }}
            >
              <span aria-hidden="true">{icon}</span>
              <span>{locale === 'de' ? de : en}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
