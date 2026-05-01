import { memo, useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'

function SproutIcon({ active }) {
  const c = active ? '#2b1d0e' : '#98876b'
  const w = active ? 2 : 1.5
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-8"/>
      <path d="M12 12c0-3 2-5 5-5-.2 3-2.2 5-5 5z"/>
      <path d="M12 14c0-2-1.5-4-4-4 .2 2.5 1.8 4 4 4z"/>
    </svg>
  )
}

function MagnifyIcon({ active }) {
  const c = active ? '#2b1d0e' : '#98876b'
  const w = active ? 2 : 1.5
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5"/>
      <path d="M20 20l-4-4"/>
    </svg>
  )
}

function HiveIcon({ active }) {
  const c = active ? '#2b1d0e' : '#98876b'
  const w = active ? 2 : 1.5
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="13" rx="5" ry="7"/>
      <path d="M7 10h10M7 14h10"/>
      <circle cx="12" cy="7" r="2"/>
    </svg>
  )
}

const BottomNav = memo(function BottomNav({ activeTab, onTabChange }) {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const TABS = useMemo(() => [
    { key: 'season',   label: t(s.nav_season),   emoji: '📅', Icon: SproutIcon },
    { key: 'diagnose', label: t(s.nav_diagnose),  emoji: '🔎', Icon: MagnifyIcon },
    { key: 'myhive',   label: t(s.nav_myhive),    emoji: '🐝', Icon: HiveIcon },
  ], [t])

  if (theme === 'c') {
    return (
      <nav className="flex justify-center pb-5 pt-1">
        <div style={{
          display: 'flex',
          padding: 6,
          background: 'rgba(28,20,16,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 999,
          gap: 4,
          boxShadow: '0 10px 30px rgba(28,20,16,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {TABS.map(({ key, label, emoji }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: isActive ? '10px 16px' : '10px 14px',
                  background: isActive ? '#fff' : 'transparent',
                  borderRadius: 999,
                  border: 'none',
                  color: isActive ? '#1c1410' : 'rgba(255,255,255,0.75)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: 15 }}>{emoji}</span>
                {isActive && <span>{label}</span>}
              </button>
            )
          })}
        </div>
      </nav>
    )
  }

  if (theme === 'b') {
    return (
      <nav
        style={{
          background: 'var(--theme-nav-bg)',
          borderTop: '1px solid var(--theme-nav-border)',
          paddingBottom: 28,
          paddingTop: 10,
          display: 'flex',
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                paddingTop: 6,
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: -11,
                  width: 24,
                  height: 3,
                  background: '#2b1d0e',
                  borderRadius: 2,
                }} />
              )}
              <Icon active={isActive} />
              <span style={{
                fontFamily: 'var(--theme-font-mono)',
                fontSize: 10.5,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: isActive ? '#2b1d0e' : '#98876b',
                fontWeight: isActive ? 700 : 400,
              }}>{label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  // Theme A: hex active indicator
  return (
    <nav className="bg-white border-t border-amber-100 flex">
      {TABS.map(({ key, label, emoji }) => {
        const isActive = activeTab === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors"
            style={{ color: isActive ? '#3d1f00' : '#9ca3af' }}
          >
            <div style={{ position: 'relative', width: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#f5a623',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }} />
              )}
              <span style={{ position: 'relative', fontSize: 18, filter: isActive ? 'none' : 'grayscale(0.2) opacity(0.6)' }}>
                {emoji}
              </span>
            </div>
            {label}
          </button>
        )
      })}
    </nav>
  )
})

export default BottomNav
