import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import { METRIC_CONFIGS } from '../utils/inspectionHistory'
import InspectionScaleInput from './InspectionScaleInput'
import SectionLabel from './SectionLabel'
import { themeColors } from '../utils/themeTokens'
import { localDateString } from '../utils/inspectionHistory'
import { useDraftProtection } from '../hooks/useDraftProtection'
import { draftFromInspection, inspectionFromDraft, saveVerdict, TREATMENT_PRESETS } from '../utils/inspectionDraft'

const QUEEN_OPTIONS = [
  { value: 'seen',     emoji: '👑', label: s.insp_queen_seen     },
  { value: 'eggs',     emoji: '🥚', label: s.insp_queen_eggs     },
  { value: 'larvae',   emoji: '🐛', label: s.insp_queen_larvae   },
  { value: 'not_seen', emoji: '❓', label: s.insp_queen_not_seen },
]

const TEMPERAMENT_OPTIONS = [
  { value: 'calm',      label: s.insp_temperament_calm      },
  { value: 'normal',    label: s.insp_temperament_normal    },
  { value: 'defensive', label: s.insp_temperament_defensive },
]

// The presets come from the draft module, so the form and the translation
// of a recorded treatment back into a draft cannot disagree.
const TREATMENT_LABELS = {
  none: s.insp_treatment_none,
  varroa: s.insp_treatment_varroa,
  feeding: s.insp_treatment_feeding,
  queen: s.insp_treatment_queen,
  other: s.insp_treatment_other,
}
const TREATMENT_OPTIONS = [...TREATMENT_PRESETS, 'other'].map((value) => ({
  value, label: TREATMENT_LABELS[value],
}))

function FieldLabel({ text, htmlFor, id, color }) {
  const style = { margin: '0 0 6px', fontSize: 13, fontWeight: 600, color, display: 'block' }
  if (htmlFor) return <label htmlFor={htmlFor} style={style}>{text}</label>
  return <p id={id} style={style}>{text}</p>
}

export default function InspectionForm({ colonies = [], initial = null, initialColonyId = null, onSave, onClose }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const dialogRef = useRef(null)
  const { markDraft, clearDraft } = useDraftProtection()
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const focusable = el.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (first) first.focus()
    function trap(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    el.addEventListener('keydown', trap)
    return () => el.removeEventListener('keydown', trap)
  }, [onClose])

  const [draft, setDraft] = useState(() => draftFromInspection(initial, { colonies, initialColonyId, today: localDateString() }))
  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }))
  const {
    date, colonyId, queenStatus, queenYear, broodPattern, honeyStores, population, temperament,
    varroaChecked, varroa, treatment, treatmentOther, harvest, notes,
  } = draft

  const isEditing = Boolean(initial)
  const canSave   = date && colonies.some((colony) => colony.id === colonyId) && queenStatus

  const isDark   = theme === 'c'
  const c        = themeColors(theme)
  const bg       = c.formBg
  const ink      = c.formInk
  const inkMid   = c.formInkMid
  const border   = c.border
  const inputBg  = c.formInputBg
  const headFont = theme === 'b' ? 'var(--theme-font-head)' : '"Playfair Display", serif'

  function handleSave() {
    if (!canSave) return
    const result = inspectionFromDraft(draft)
    if (!result.ok) {
      setSaveError(result.messageKey)
      return
    }
    const verdict = saveVerdict(onSave(result.inspection))
    if (!verdict.close) {
      setSaveError(verdict.messageKey)
      return
    }
    clearDraft()
    onClose()
  }

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="insp-form-title" onChangeCapture={() => { markDraft(); setSaveError(null) }} onClickCapture={(event) => {
      if (event.target.closest('button')) markDraft()
    }} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: bg }}>
      {/* sticky header */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, background: bg, zIndex: 1 }}>
        <h2 id="insp-form-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ink, fontFamily: headFont }}>
          {isEditing ? t(s.insp_title_edit) : t(s.insp_title_add)}
        </h2>
        <button type="button" onClick={onClose} style={{ fontSize: 15, color: inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          {t(s.insp_cancel)}
        </button>
      </div>

      {/* scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }}>

        {/* ─ Section 1: Date & colony ─ */}
        <SectionLabel text={t(s.insp_section_when)} color={inkMid} mono={theme === 'b'} />

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_date_label)} htmlFor="insp-date" color={ink} />
          <input
            id="insp-date"
            type="date"
            value={date}
            onChange={(e) => setField('date', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_colony_label)} htmlFor="insp-colony" color={ink} />
          {colonies.length === 0 ? (
            <p style={{ color: inkMid, fontSize: 13 }}>{t(s.colonies_empty)}</p>
          ) : (
            <select
              id="insp-colony"
              value={colonyId}
              onChange={(e) => setField('colonyId', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
            >
              {colonies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* ─ Section 2: Health ─ */}
        <SectionLabel text={t(s.insp_section_health)} color={inkMid} mono={theme === 'b'} />

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_queen_label)} id="insp-queen-lbl" color={ink} />
          <div role="group" aria-labelledby="insp-queen-lbl" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUEEN_OPTIONS.map((opt) => {
              const active = queenStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('queenStatus', active ? null : opt.value)}
                  aria-pressed={active}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 24,
                    border: `2px solid ${active ? c.accent : border}`,
                    background: active ? c.queenActiveBg : 'transparent',
                    color: active ? c.queenActiveColor : inkMid,
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {opt.emoji} {t(opt.label)}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_queen_year_label)} htmlFor="insp-queen-year" color={ink} />
          <input
            id="insp-queen-year"
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={queenYear}
            onChange={(e) => setField('queenYear', e.target.value)}
            placeholder={t(s.insp_queen_year_placeholder)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_harvest_label)} htmlFor="insp-harvest" color={ink} />
          <input
            id="insp-harvest"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={harvest}
            onChange={(e) => setField('harvest', e.target.value)}
            placeholder={t(s.insp_harvest_placeholder)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_brood_label)} id="insp-brood-lbl" color={ink} />
          <InspectionScaleInput value={broodPattern} onChange={(value) => setField('broodPattern', value)} theme={theme} labelId="insp-brood-lbl" stepKeys={METRIC_CONFIGS.find((m) => m.key === 'broodPattern').stepKeys} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s[METRIC_CONFIGS.find((m) => m.key === 'honeyStores').labelKey])} id="insp-stores-lbl" color={ink} />
          <InspectionScaleInput value={honeyStores} onChange={(value) => setField('honeyStores', value)} theme={theme} labelId="insp-stores-lbl" stepKeys={METRIC_CONFIGS.find((m) => m.key === 'honeyStores').stepKeys} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel text={t(s.insp_population_label)} id="insp-pop-lbl" color={ink} />
          <InspectionScaleInput value={population} onChange={(value) => setField('population', value)} theme={theme} labelId="insp-pop-lbl" stepKeys={METRIC_CONFIGS.find((m) => m.key === 'population').stepKeys} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_temperament_label)} id="insp-temper-lbl" color={ink} />
          <div role="group" aria-labelledby="insp-temper-lbl" style={{ display: 'flex', gap: 8 }}>
            {TEMPERAMENT_OPTIONS.map((opt) => {
              const active = temperament === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('temperament', active ? null : opt.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    borderRadius: 10,
                    border: `2px solid ${active ? c.accent : border}`,
                    background: active ? c.temperActiveBg : 'transparent',
                    color: active ? c.queenActiveColor : inkMid,
                    fontSize: 13,
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {t(opt.label)}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─ Section 3: Treatment ─ */}
        <SectionLabel text={t(s.insp_section_treatment)} color={inkMid} mono={theme === 'b'} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FieldLabel text={t(s.insp_varroa_label)} color={ink} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', color: inkMid, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!varroaChecked}
                onChange={(e) => setField('varroaChecked', !e.target.checked)}
              />
              {t(s.insp_varroa_not_tested)}
            </label>
          </div>
          {varroaChecked && (
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={varroa}
              onChange={(e) => setField('varroa', e.target.value)}
              placeholder="0.0"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
            />
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_treatment_label)} id="insp-treatment-lbl" color={ink} />
          <div role="group" aria-labelledby="insp-treatment-lbl" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {TREATMENT_OPTIONS.map((opt) => {
              const active = treatment === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('treatment', active ? '' : opt.value)}
                  aria-pressed={active}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 24,
                    border: `2px solid ${active ? c.accent : border}`,
                    background: active ? c.queenActiveBg : 'transparent',
                    color: active ? c.queenActiveColor : inkMid,
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  {t(opt.label)}
                </button>
              )
            })}
          </div>
          {treatment === 'other' && (
            <input
              id="insp-treatment"
              type="text"
              maxLength={500}
              value={treatmentOther ?? ''}
              onChange={(e) => setField('treatmentOther', e.target.value)}
              placeholder={t(s.insp_treatment_placeholder)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, boxSizing: 'border-box' }}
            />
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel text={t(s.insp_notes_label)} htmlFor="insp-notes" color={ink} />
          <textarea
            id="insp-notes"
            maxLength={1000}
            value={notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder={t(s.insp_notes_placeholder)}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: ink, fontSize: 15, resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

      </div>

      {/* sticky save bar */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: bg, position: 'sticky', bottom: 0 }}>
        {saveError && <p role="alert" className="mb-2 text-sm font-semibold" style={{ color: ink }}>{t(s[saveError])}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          aria-disabled={!canSave}
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
