import { useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import ThemeSwitcher from '../components/ThemeSwitcher'

function getButtonStyle(theme, isActive) {
  if (theme === 'b') {
    return isActive
      ? { background: '#2b1d0e', borderColor: '#2b1d0e', color: '#f4ecd8' }
      : { background: '#fff', borderColor: '#c8b890', color: '#2b1d0e' }
  }
  if (theme === 'c') {
    return isActive
      ? { background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.4)', color: '#1c1410' }
      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.15)', color: '#6b5843' }
  }
  return isActive
    ? { background: '#f5a623', borderColor: '#e8890c', color: '#3d1f00' }
    : { background: '#fff', borderColor: '#fde68a', color: '#92400e' }
}

function OptionGroup({ title, options, currentValue, fieldKey, onUpdate, theme }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: 'var(--theme-font-head, serif)', fontSize: 12, fontWeight: 600, color: 'var(--theme-ink-mid, #92400e)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 0 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(({ label, value }) => {
          const isActive = currentValue === value
          const btnStyle = getButtonStyle(theme, isActive)
          return (
            <button
              key={String(value)}
              onClick={() => onUpdate({ [fieldKey]: value })}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
                ...btnStyle,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ProfileSection({ profile, onUpdate }) {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const HIVE_OPTIONS = useMemo(() => [
    { label: t(s.hive_1),  value: 1  },
    { label: t(s.hive_2),  value: 2  },
    { label: t(s.hive_5),  value: 5  },
    { label: t(s.hive_10), value: 10 },
  ], [t])
  const ZONE_OPTIONS = useMemo(() => [
    { label: t(s.zone_northern),      value: 'northern'      },
    { label: t(s.zone_central),       value: 'central'       },
    { label: t(s.zone_mediterranean), value: 'mediterranean' },
    { label: t(s.zone_other),         value: 'other'         },
  ], [t])
  const EXPERIENCE_OPTIONS = useMemo(() => [
    { label: t(s.exp_0), value: 0 },
    { label: t(s.exp_1), value: 1 },
    { label: t(s.exp_2), value: 2 },
  ], [t])

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--theme-font-head, serif)', fontSize: 16, fontWeight: 600, color: 'var(--theme-ink, #3d1f00)', marginBottom: 16 }}>{t(s.profile_title)}</h2>
      <ThemeSwitcher />
      <OptionGroup
        title={t(s.hive_count_title)}
        options={HIVE_OPTIONS}
        currentValue={profile.hiveCount}
        fieldKey="hiveCount"
        onUpdate={onUpdate}
        theme={theme}
      />
      <OptionGroup
        title={t(s.climate_title)}
        options={ZONE_OPTIONS}
        currentValue={profile.climateZone}
        fieldKey="climateZone"
        onUpdate={onUpdate}
        theme={theme}
      />
      <OptionGroup
        title={t(s.experience_title)}
        options={EXPERIENCE_OPTIONS}
        currentValue={profile.experience}
        fieldKey="experience"
        onUpdate={onUpdate}
        theme={theme}
      />
    </div>
  )
}
