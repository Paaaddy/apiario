import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import InspectionScaleInput from './InspectionScaleInput'

function today() {
  return new Date().toISOString().split('T')[0]
}

const QUEEN_OPTIONS = [
  { value: 'seen',     emoji: '👑', key: 'insp_queen_seen'     },
  { value: 'eggs',     emoji: '🥚', key: 'insp_queen_eggs'     },
  { value: 'larvae',   emoji: '🐛', key: 'insp_queen_larvae'   },
  { value: 'not_seen', emoji: '❓', key: 'insp_queen_not_seen' },
]

const TEMPERAMENT_OPTIONS = [
  { value: 'calm',      key: 'insp_temperament_calm'      },
  { value: 'normal',    key: 'insp_temperament_normal'    },
  { value: 'defensive', key: 'insp_temperament_defensive' },
]

export default function InspectionForm({ colonies = [], initial = null, onSave, onClose }) {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const [date, setDate]                   = useState(initial?.date ?? today())
  const [colonyId, setColonyId]           = useState(initial?.colonyId ?? (colonies[0]?.id ?? ''))
  const [queenStatus, setQueenStatus]     = useState(initial?.queenStatus ?? null)
  const [broodPattern, setBrood]          = useState(initial?.broodPattern ?? null)
  const [honeyStores, setStores]          = useState(initial?.honeyStores ?? null)
  const [population, setPop]              = useState(initial?.population ?? null)
  const [temperament, setTemper]          = useState(initial?.temperament ?? null)
  const [varroaChecked, setVarroaChecked] = useState(initial?.varroa != null)
  const [varroa, setVarroa]               = useState(initial?.varroa ?? '')
  const [treatment, setTreatment]         = useState(initial?.treatment ?? '')
  const [notes, setNotes]                 = useState(initial?.notes ?? '')

  const isEditing = Boolean(initial)
  const canSave   = date && colonyId && queenStatus

  const isDark   = theme === 'c'
  const bg       = isDark ? '#1c1410' : theme === 'b' ? '#f4ecd8' : '#fff'
  const ink      = isDark ? '#fff'    : theme === 'b' ? '#2b1d0e' : '#3d1f00'
  const inkMid   = isDark ? 'rgba(255,255,255,0.6)' : theme === 'b' ? '#6b5838' : '#92400e'
  const border   = isDark ? 'rgba(255,255,255,0.15)' : theme === 'b' ? '#c8b890' : '#e9d5a1'
  const inputBg  = isDark ? 'rgba(255,255,255,0.07)' : '#fff'
  const headFont = theme === 'b' ? 'var(--theme-font-head)' : '"Playfair Display", serif'

  function handleSave() {
    if (!canSave) return
    onSave({
      colonyId,
      date,
      queenStatus,
      broodPattern,
      honeyStores,
      population,
      temperament,
      varroa: varroaChecked ? (varroa === '' ? null : Number(varroa)) : null,
      treatment: treatment.trim() || null,
      notes: notes.trim() || null,
    })
    onClose()
  }

  function SectionLabel({ text }) {
    return (
      <p style={{ margin: '20px 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: inkMid, fontFamily: theme === 'b' ? 'var(--theme-font-mono)' : undefined }}>
        {text}
      </p>
    )
  }

  function FieldLabel({ text }) {
    return (
      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: ink }}>
        {text}
      </p>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: bg }}>
      {/* sticky header */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, background: bg, zIndex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ink, fontFamily: headFont }}>
          {isEditing ? t(s.insp_title_edit) : t(s.insp_title_add)}
        </h2>
        <button type="button" onClick={onClose} style={{ fontSize: 15, color: inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          {t(s.insp_cancel)}
        </button>
      </div>

      {/* scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }}>

        {/* ─ Section 1: Date & colony ─ */}
        <SectionLabel text={t(s.insp_section_when)} />

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_date_label)} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_colony_label)} />
          {colonies.length === 0 ? (
            <p style={{ color: inkMid, fontSize: 13 }}>{t(s.colonies_empty)}</p>
          ) : (
            <select
              value={colonyId}
              onChange={(e) => setColonyId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
            >
              {colonies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* ─ Section 2: Health ─ */}
        <SectionLabel text={t(s.insp_section_health)} />

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_queen_label)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUEEN_OPTIONS.map((opt) => {
              const active = queenStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQueenStatus(active ? null : opt.value)}
                  aria-pressed={active}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 24,
                    border: `2px solid ${active ? '#f5a623' : border}`,
                    background: active ? (isDark ? 'rgba(245,166,35,0.25)' : '#fef3c7') : 'transparent',
                    color: active ? (isDark ? '#f5a623' : '#92400e') : inkMid,
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {opt.emoji} {t(s[opt.key])}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_brood_label)} />
          <InspectionScaleInput value={broodPattern} onChange={setBrood} theme={theme} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_stores_label)} />
          <InspectionScaleInput value={honeyStores} onChange={setStores} theme={theme} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_population_label)} />
          <InspectionScaleInput value={population} onChange={setPop} theme={theme} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_temperament_label)} />
          <div style={{ display: 'flex', gap: 8 }}>
            {TEMPERAMENT_OPTIONS.map((opt) => {
              const active = temperament === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTemper(active ? null : opt.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    borderRadius: 10,
                    border: `2px solid ${active ? '#f5a623' : border}`,
                    background: active ? (isDark ? 'rgba(245,166,35,0.2)' : '#fef3c7') : 'transparent',
                    color: active ? (isDark ? '#f5a623' : '#92400e') : inkMid,
                    fontSize: 13,
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {t(s[opt.key])}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─ Section 3: Treatment ─ */}
        <SectionLabel text={t(s.insp_section_treatment)} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FieldLabel text={t(s.insp_varroa_label)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', color: inkMid, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!varroaChecked}
                onChange={(e) => setVarroaChecked(!e.target.checked)}
              />
              {t(s.insp_varroa_not_tested)}
            </label>
          </div>
          {varroaChecked && (
            <input
              type="number"
              min="0"
              step="0.1"
              value={varroa}
              onChange={(e) => setVarroa(e.target.value)}
              placeholder="0.0"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
            />
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_treatment_label)} />
          <input
            type="text"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder={t(s.insp_treatment_placeholder)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_notes_label)} />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(s.insp_notes_placeholder)}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

      </div>

      {/* sticky save bar */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: bg, position: 'sticky', bottom: 0 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            background: canSave ? '#f5a623' : (isDark ? 'rgba(255,255,255,0.1)' : '#e9d5a1'),
            color: canSave ? '#3d1f00' : inkMid,
            fontWeight: 700,
            fontSize: 16,
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          {t(s.insp_save)}
        </button>
      </div>
    </div>
  )
}
