import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

const TABS = [
  { id: 'colonies',    key: 'tab_colonies'    },
  { id: 'inspections', key: 'tab_inspections' },
  { id: 'log',         key: 'tab_log'         },
  { id: 'profile',     key: 'tab_profile'     },
]

export default function MyHiveTabStrip({ activeTab, onTabChange, theme = 'a' }) {
  const { t } = useLanguage()

  if (theme === 'b') {
    return (
      <div style={{ display: 'flex', borderBottom: '1px solid #c8b890', gap: 0, marginTop: 10 }}>
        {TABS.map(({ id, key }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #2b1d0e' : '2px solid transparent',
                fontFamily: 'var(--theme-font-mono)',
                fontSize: 10,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: active ? '#2b1d0e' : '#6b5838',
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                marginBottom: -1,
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
              style={{
                flex: 1,
                padding: '7px 6px',
                borderRadius: 20,
                border: 'none',
                background: active ? 'rgba(245,166,35,0.85)' : 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                color: active ? '#1c1410' : 'rgba(255,255,255,0.55)',
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
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
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 8,
              border: 'none',
              background: active ? '#3d1f00' : 'rgba(255,255,255,0.35)',
              color: active ? '#f5a623' : '#92400e',
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {t(s[key])}
          </button>
        )
      })}
    </div>
  )
}
