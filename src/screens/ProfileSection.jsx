import { useMemo, useRef, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { useDataPort } from '../hooks/useDataPort'
import { strings as s } from '../i18n/strings'
import ThemeSwitcher from '../components/ThemeSwitcher'
import { getButtonStyle } from '../utils/themeButtonStyle'
import { themeColors } from '../utils/themeTokens'

function OptionGroup({ title, options, currentValue, fieldKey, onUpdate, theme }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: 'var(--theme-font-head, serif)', fontSize: 12, fontWeight: 600, color: 'var(--theme-ink-mid, #92400e)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 0 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(({ label, value }) => {
          const isActive = currentValue === value
          const btnStyle = getButtonStyle(theme, isActive)
          return (
            <button
              key={String(value)}
              onClick={() => onUpdate({ [fieldKey]: value })}
              style={{
                textAlign: 'center',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
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

function DataPrivacyCollapse({ theme }) {
  const { t } = useLanguage()
  const { exportData, importData } = useDataPort()
  const fileInputRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(null)
  const c = themeColors(theme)

  async function handleExport() {
    exportData()
    setStatus({ kind: 'success', message: t(s.data_exported) })
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await importData(file)
    if (result.ok) {
      setStatus({ kind: 'success', message: t(s.data_import_reload) })
      window.location.reload()
    } else {
      const errorKey =
        result.error === 'parse'
          ? s.data_import_error_parse
          : result.error === 'format'
            ? s.data_import_error_format
            : s.data_import_error_unexpected
      setStatus({ kind: 'error', message: t(errorKey) })
    }
  }

  const btnBase = {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        <h3 style={{ fontFamily: 'var(--theme-font-head, serif)', fontSize: 12, fontWeight: 600, color: 'var(--theme-ink-mid, #92400e)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {t(s.data_title)}
        </h3>
        <span aria-hidden="true" style={{ color: 'var(--theme-ink-mid, #92400e)', fontSize: 12, flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid var(--theme-rule, #f0e4c2)` }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--theme-ink-mid, #92400e)', lineHeight: 1.4 }}>
              {t(s.data_hint)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={handleExport} style={{ ...btnBase, ...getButtonStyle(theme, false) }}>
                {t(s.data_export)}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ ...btnBase, ...getButtonStyle(theme, false) }}
              >
                {t(s.data_import)}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {status && (
              <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 600, color: status.kind === 'error' ? 'var(--theme-accent, #d33)' : 'var(--theme-ink-mid, #92400e)' }}>
                {status.message}
              </p>
            )}
          </div>

          <div style={{ paddingTop: 12, borderTop: `1px solid var(--theme-rule, #f0e4c2)` }}>
            <h3 style={{ fontFamily: 'var(--theme-font-head, serif)', fontSize: 12, fontWeight: 600, color: 'var(--theme-ink-mid, #92400e)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 0 }}>
              {t(s.privacy_title)}
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--theme-ink-mid, #92400e)', lineHeight: 1.4 }}>
              {t(s.privacy_body)}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--theme-ink-mid, #92400e)', lineHeight: 1.4 }}>
              {t(s.privacy_delete_warning)}
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--theme-ink-mid, #92400e)', lineHeight: 1.4 }}>
              {t(s.privacy_export_pointer)}
            </p>
          </div>
        </div>
      )}
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
      {(() => {
        const zone = profile.climateZone
        const hintKey =
          zone === 'northern' ? s.climate_winter_hint :
          zone === 'central' ? s.climate_winter_hint_central :
          zone === 'mediterranean' ? s.climate_winter_hint_mediterranean :
          s.climate_winter_hint_other
        return (
          <p style={{
            margin: '-8px 0 24px',
            fontSize: 12.5,
            color: 'var(--theme-ink-mid, #92400e)',
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}>
            {t(hintKey)}
          </p>
        )
      })()}
      <OptionGroup
        title={t(s.experience_title)}
        options={EXPERIENCE_OPTIONS}
        currentValue={profile.experience}
        fieldKey="experience"
        onUpdate={onUpdate}
        theme={theme}
      />
      <DataPrivacyCollapse theme={theme} />
    </div>
  )
}
