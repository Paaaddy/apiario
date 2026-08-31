import { useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import { themeColors } from '../utils/themeTokens'
import InspectionCard from '../components/InspectionCard'

const SPARKLINE_CONFIGS = [
  { key: 'varroa',      label: { de: 'Varroa / 100 Bienen', en: 'Varroa / 100 bees' }, min: 0, max: 10, lowerBetter: true },
  { key: 'broodPattern', label: { de: 'Brutstimmung', en: 'Brood pattern' }, min: 1, max: 5, lowerBetter: false },
  { key: 'population',   labelKey: 'insp_population_label', min: 1, max: 5, lowerBetter: false },
  { key: 'honeyStores',  labelKey: 'insp_honeystores_label', min: 1, max: 5, lowerBetter: false },
]

function buildSparklinePoints(values, w, h, pad) {
  const span = values.length === 1 ? 1 : values.length - 1
  return values.map((d, i) => ({
    x: (i / span) * w,
    y: pad + ((d.value - d.min) / (d.max - d.min || 1)) * (h - 2 * pad),
  }))
}

function Sparkline({ data, min, max, strokeColor }) {
  const w = 140
  const h = 36
  const pad = 4

  const points = buildSparklinePoints(data.map(d => ({ value: d.value, min, max })), w, h, pad)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${(h - p.y).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x.toFixed(1)} cy={(h - last.y).toFixed(1)} r={3} fill={strokeColor} />
    </svg>
  )
}

function SparklineCard({ label, data, min, max, strokeColor, lowerBetter, border, inkMid, mono }) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 150, padding: '12px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: inkMid, fontFamily: mono ? 'var(--theme-font-mono)' : undefined }}>
          {label}
        </p>
        <span style={{ fontSize: 9, color: inkMid, opacity: 0.6 }}>{lowerBetter ? 'lower ▾' : 'higher ▴'}</span>
      </div>
      {data.length >= 2 ? (
        <Sparkline data={data} min={min} max={max} strokeColor={strokeColor} />
      ) : (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: inkMid, opacity: 0.5 }}>Not enough data</p>
      )}
    </div>
  )
}

export default function ColonyDetail({ colony, inspections, onBack }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  
  const c = themeColors(theme)
  const bg = c.formBg
  const ink = c.formInk
  const inkMid = c.formInkMid
  const border = c.border

  const colonyInspections = useMemo(() => {
    return inspections
      .filter(i => i.colonyId === colony.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [inspections, colony.id])

  const totalHarvest = useMemo(() => {
    return colonyInspections.reduce((sum, i) => sum + (i.harvest || 0), 0)
  }, [colonyInspections])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: bg, color: ink, position: 'relative' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12, background: bg, position: 'sticky', top: 0, zIndex: 1 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: inkMid, padding: 4 }}>←</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--theme-font-head)' }}>{colony.name}</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: '12px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: inkMid, fontWeight: 600, textTransform: 'uppercase' }}>{t(s.colony_total_harvest)}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ink }}>{totalHarvest.toFixed(1)} kg</p>
            </div>
            <div style={{ flex: 1, padding: '12px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: inkMid, fontWeight: 600, textTransform: 'uppercase' }}>{t(s.colony_inspections_count)}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ink }}>{colonyInspections.length}</p>
            </div>
          </div>

          {colony.notes && (
            <div style={{ padding: '12px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', fontSize: 14, color: inkMid, fontStyle: 'italic' }}>
              {colony.notes}
            </div>
          )}
        </div>

        <SectionLabel text={t(s.insp_history)} color={inkMid} mono={theme === 'b'} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, marginBottom: 20 }}>
          {SPARKLINE_CONFIGS.map(cfg => {
            const data = colonyInspections
              .filter(i => i[cfg.key] != null)
              .map(i => ({ date: i.date, value: Number(i[cfg.key]) }))
            const strokeColor = cfg.key === 'varroa' ? '#d44' : c.accent
            return (
              <SparklineCard
                key={cfg.key}
                label={cfg.label ? t(cfg.label) : t(s[cfg.labelKey])}
                data={data}
                min={cfg.min}
                max={cfg.max}
                strokeColor={strokeColor}
                lowerBetter={cfg.lowerBetter}
                border={border}
                inkMid={inkMid}
                mono={theme === 'b'}
              />
            )
          })}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {colonyInspections.length > 0 ? (
            colonyInspections.map(insp => (
              <InspectionCard 
                key={insp.id} 
                inspection={insp} 
                colonyName={colony.name}
                onEdit={() => {}}
                onDelete={() => {}} 
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', color: inkMid, fontSize: 14, marginTop: 20 }}>{t(s.insp_no_history)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ text, color, mono }) {
  return (
    <p style={{ margin: '20px 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color, fontFamily: mono ? 'var(--theme-font-mono)' : undefined }}>
      {text}
    </p>
  )
}
