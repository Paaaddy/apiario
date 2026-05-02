import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'

const QUEEN_EMOJI = { seen: '👑', eggs: '🥚', larvae: '🐛', not_seen: '❓' }

function ScaleDots({ value }) {
  if (value == null) return null
  return (
    <span style={{ letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ opacity: n <= value ? 1 : 0.22 }}>●</span>
      ))}
    </span>
  )
}

function DetailRow({ label, value, ink, inkMid }) {
  return (
    <tr>
      <td style={{ fontSize: 12, color: inkMid, paddingBottom: 4, paddingRight: 12, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
      <td style={{ fontSize: 13, color: ink, paddingBottom: 4 }}>{String(value)}</td>
    </tr>
  )
}

export default function InspectionCard({ inspection, colonyName, onEdit, onDelete }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)

  const isDark = theme === 'c'
  const bg     = isDark ? 'rgba(255,255,255,0.06)' : theme === 'b' ? '#fff9f0' : '#fff'
  const ink    = isDark ? '#fff'    : theme === 'b' ? '#2b1d0e' : '#3d1f00'
  const inkMid = isDark ? 'rgba(255,255,255,0.55)' : theme === 'b' ? '#6b5838' : '#92400e'
  const border = isDark ? 'rgba(255,255,255,0.12)' : theme === 'b' ? '#c8b890' : '#f0e0b8'

  const queenEmoji = QUEEN_EMOJI[inspection.queenStatus] ?? '❓'

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
      {/* compact summary row — tap to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        aria-expanded={expanded}
      >
        <span style={{ fontSize: 20 }}>{queenEmoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: ink }}>{inspection.date}</p>
          {colonyName && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: inkMid }}>{colonyName}</p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {inspection.broodPattern != null && (
              <span style={{ fontSize: 11, color: inkMid }}>
                🍯 <ScaleDots value={inspection.broodPattern} />
              </span>
            )}
            {inspection.honeyStores != null && (
              <span style={{ fontSize: 11, color: inkMid }}>
                🏺 <ScaleDots value={inspection.honeyStores} />
              </span>
            )}
            {inspection.population != null && (
              <span style={{ fontSize: 11, color: inkMid }}>
                🐝 <ScaleDots value={inspection.population} />
              </span>
            )}
          </div>
        </div>
        <span style={{ color: inkMid, fontSize: 14, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* expanded detail */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <tbody>
              {inspection.temperament && (
                <DetailRow
                  label={t(s.insp_temperament_label)}
                  value={t(s[`insp_temperament_${inspection.temperament}`])}
                  ink={ink}
                  inkMid={inkMid}
                />
              )}
              <DetailRow
                label={t(s.insp_varroa_label)}
                value={inspection.varroa != null ? inspection.varroa : t(s.insp_varroa_not_tested)}
                ink={ink}
                inkMid={inkMid}
              />
              {inspection.treatment && (
                <DetailRow label={t(s.insp_treatment_label)} value={inspection.treatment} ink={ink} inkMid={inkMid} />
              )}
              {inspection.notes && (
                <DetailRow label={t(s.insp_notes_label)} value={inspection.notes} ink={ink} inkMid={inkMid} />
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onEdit(inspection)}
              style={{ fontSize: 12, color: inkMid, background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
            >
              {t(s.insp_edit_label)}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t(s.insp_delete_confirm))) onDelete(inspection.id)
              }}
              style={{ fontSize: 12, color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
            >
              {t(s.insp_delete)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
