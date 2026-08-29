import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import { themeColors } from '../utils/themeTokens'

const TABS = [
  { id: 'colonies',    key: 'tab_colonies'    },
  { id: 'inspections', key: 'tab_inspections' },
  { id: 'log',         key: 'tab_log'         },
  { id: 'profile',     key: 'tab_profile'     },
]

export default function MyHiveTabStrip({ activeTab, onTabChange, theme = 'a' }) {
  const { t } = useLanguage()
  const c = themeColors(theme)

  if (theme === 'b') {
    return (
      <div style={{ display: 'flex', borderBottom: `1px solid ${c.rule}`, gap: 0, marginTop: 10 }}>
        {TABS.map(({ id, key }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={active ? 'true' : undefined}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                borderBottom: active ? `2px solid ${c.ink}` : '2px solid transparent',
                fontFamily: 'var(--theme-font-mono)',
                fontSize: 10,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: active ? c.ink : c.inkMid,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                marginBottom: -1,
                minHeight: 44,
              }}
            >
              {t(s[key])}
            </button>
          )
        })}
      </div>
    )
  }

  if (theme === 'c') {
    return (
      <div style={{ display: 'flex', gap: 4, padding: '8px 0 4px' }}>
        {TABS.map(({ id, key }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={active ? 'true' : undefined}
              style={{
                flex: 1,
                padding: '7px 6px',
                borderRadius: 20,
                border: 'none',
                background: active ? c.tabActiveBg : 'rgba(28,20,16,0.06)',
                backdropFilter: 'blur(8px)',
                color: active ? c.tabActiveColor : c.tabInactiveColor,
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 44,
              }}
            >
              {t(s[key])}
            </button>
          )
        })}
      </div>
    )
  }

  // Theme A — Honeycomb
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
      {TABS.map(({ id, key }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={active ? 'true' : undefined}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 8,
              border: 'none',
              background: active ? c.tabActiveBg : 'rgba(255,255,255,0.35)',
              color: active ? c.tabActiveColor : c.tabInactiveColor,
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
              minHeight: 44,
            }}
          >
            {t(s[key])}
          </button>
        )
      })}
    </div>
  )
}
