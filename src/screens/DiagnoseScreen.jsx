import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { validateDiagnosisTree } from '../utils/validateDiagnosis'
import { strings as s } from '../i18n/strings'
import diagnosisData from '../data/diagnosis.json'
import DiagnosisResult from '../components/DiagnosisResult'
import LanguageToggle from '../components/LanguageToggle'
import { useWakeLock } from '../hooks/useWakeLock'
import { haptics } from '../utils/haptics'
import HexWatermark from '../components/HexWatermark'

function routeFromInspection(inspection) {
  if (!inspection) return null
  if (inspection.queenStatus === 'not_seen') return 'queenless'
  if (inspection.varroa != null && inspection.varroa >= 3) return 'varroa-suspect'
  if (inspection.broodPattern != null && inspection.broodPattern <= 2) return 'sick-brood'
  return null
}

export default function DiagnoseScreen({ inspections = [] }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [currentNodeId, setCurrentNodeId] = useState('root')
  const [history, setHistory] = useState([])

  const latestInspection = inspections.length > 0
    ? inspections.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
    : null
  const prefilledNodeId = routeFromInspection(latestInspection)

  useWakeLock(true)
  useEffect(() => { validateDiagnosisTree() }, [])

  const node = diagnosisData[currentNodeId]

  function handleSelect(nextId) {
    haptics.tap()
    setHistory((prev) => [...prev, currentNodeId])
    setCurrentNodeId(nextId)
  }

  function handleReset() {
    haptics.tap()
    setHistory([])
    setCurrentNodeId('root')
  }

  if (!node) return null

  const stepNumber = history.length + 1
  const stepLabel = String(stepNumber).padStart(2, '0')

  // ── Theme C: Seasonal Light — dark moody diagnose ─────────────
  if (theme === 'c') {
    if (node.type === 'outcome') {
      return (
        <div style={{ minHeight: '100%', background: '#1c1410', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(245,166,35,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(232,123,160,0.13) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1410', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#fff' }}>🔎 {t(s.diagnose_title)}</h1>
            <LanguageToggle />
          </div>
          <div style={{ position: 'relative' }}>
            <DiagnosisResult node={node} onReset={handleReset} darkMode />
          </div>
        </div>
      )
    }

    return (
      <div style={{ minHeight: '100%', background: '#1c1410', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(245,166,35,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(232,123,160,0.13) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1410', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', fontSize: 11, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            🔎 {t(s.diagnose_step)} {stepLabel}/06
          </div>
          <LanguageToggle />
        </div>
        <div style={{ position: 'relative', padding: '18px 22px 0', display: 'flex', gap: 5 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < stepNumber ? '#f5a623' : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
        <div style={{ position: 'relative', padding: '22px 24px 12px' }}>
          <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 30, lineHeight: 1.1, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
            {t(node.question)}
          </h1>
        </div>
        <div style={{ position: 'relative', padding: '8px 22px 120px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentNodeId === 'root' && prefilledNodeId && (
            <button
              type="button"
              onClick={() => { haptics.tap(); setHistory(['root']); setCurrentNodeId(prefilledNodeId) }}
              style={{ width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: 16, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', color: '#f5a623', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              🔍 {t(s.diagnose_from_inspection)}
            </button>
          )}
          {node.options.map((option, i) => (
            <button
              key={option.next}
              onClick={() => handleSelect(option.next)}
              style={{ width: '100%', textAlign: 'left', padding: '18px 20px', borderRadius: 20, background: '#fff', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#6b5843', letterSpacing: 1, marginBottom: 4 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, color: '#1c1410', lineHeight: 1.2 }}>{t(option.label)}</span>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1c1410', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 16 }}>›</div>
            </button>
          ))}
          <button onClick={handleReset}
            style={{ marginTop: 8, background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: 'rgba(255,255,255,0.6)', padding: '8px 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
            ↺ {t(s.diagnose_restart)}
          </button>
        </div>
      </div>
    )
  }

  // ── Theme B: Field Notebook ──────────────────────────────────────
  if (theme === 'b') {
    if (node.type === 'outcome') {
      return (
        <div style={{ minHeight: '100%', background: '#f4ecd8' }}>
          <div style={{ padding: '42px 24px 12px', position: 'sticky', top: 0, zIndex: 20, background: '#f4ecd8', borderBottom: '1px solid #c8b890' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ margin: 0, fontFamily: 'var(--theme-font-mono)', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b5838' }}>
                {t(s.diagnose_title)}
              </p>
              <LanguageToggle />
            </div>
            <h1 style={{ margin: '12px 0 0', fontFamily: 'var(--theme-font-head)', fontSize: 32, fontWeight: 400, color: '#2b1d0e', letterSpacing: -0.3 }}>
              🔎 {t(s.diagnose_title)}
            </h1>
          </div>
          <DiagnosisResult node={node} onReset={handleReset} />
        </div>
      )
    }

    return (
      <div style={{ minHeight: '100%', background: '#f4ecd8' }}>
        <div style={{ padding: '42px 24px 12px', position: 'sticky', top: 0, zIndex: 20, background: '#f4ecd8', borderBottom: '1px solid #c8b890' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontFamily: 'var(--theme-font-mono)', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b5838' }}>
              {t(s.diagnose_title)} · {t(s.diagnose_step)} {stepLabel}/06
            </p>
            <LanguageToggle />
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 2, background: i < stepNumber ? '#2b1d0e' : '#c8b890' }} />
            ))}
          </div>
          <h1 style={{ margin: '18px 0 4px', fontFamily: 'var(--theme-font-head)', fontSize: 26, fontWeight: 400, color: '#2b1d0e', lineHeight: 1.2 }}>
            {t(node.question)}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#98876b', fontStyle: 'italic', fontFamily: 'var(--theme-font-head)' }}>
            {t(s.diagnose_step)} {stepNumber}
          </p>
        </div>
        <div style={{ padding: '16px 24px 120px' }}>
          {currentNodeId === 'root' && prefilledNodeId && (
            <button
              type="button"
              onClick={() => { haptics.tap(); setHistory(['root']); setCurrentNodeId(prefilledNodeId) }}
              style={{ width: '100%', textAlign: 'left', marginBottom: 12, padding: '12px 14px', background: '#f4ecd8', border: '1px solid #c8b890', borderRadius: 4, fontFamily: 'var(--theme-font-head)', fontSize: 14, color: '#2b1d0e', cursor: 'pointer' }}
            >
              🔍 {t(s.diagnose_from_inspection)}
            </button>
          )}
          {node.options.map((option, i) => (
            <div
              key={option.next}
              onClick={() => handleSelect(option.next)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(option.next)}
              style={{ padding: '16px 4px', borderBottom: '1px solid rgba(200,184,144,0.4)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            >
              <span style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 10, color: '#98876b', width: 22, flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1, fontFamily: 'var(--theme-font-head)', fontSize: 17, color: '#2b1d0e', lineHeight: 1.3 }}>{t(option.label)}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#98876b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6"/>
              </svg>
            </div>
          ))}
          <button onClick={handleReset}
            style={{ marginTop: 20, background: 'none', border: '1px solid #c8b890', borderRadius: 2, color: '#6b5838', padding: '8px 14px', fontSize: 11, letterSpacing: '1.5px', fontFamily: 'var(--theme-font-mono)', textTransform: 'uppercase', cursor: 'pointer' }}>
            ↺ {t(s.diagnose_restart)}
          </button>
        </div>
      </div>
    )
  }

  // ── Theme A: Honeycomb (default) ─────────────────────────────────
  if (node.type === 'outcome') {
    return (
      <div className="relative flex flex-col min-h-full">
        <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ overflow: 'hidden' }}>
          <HexWatermark />
          <div className="relative flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-serif text-2xl font-bold text-brown">🔎 {t(s.diagnose_title)}</h1>
            <LanguageToggle />
          </div>
        </div>
        <DiagnosisResult node={node} onReset={handleReset} />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold text-brown">🔎 {t(s.diagnose_title)}</h1>
            <p className="text-brown-light text-sm mt-1">{t(s.diagnose_step)} {stepNumber}</p>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="h-1 bg-amber-100">
        <div className="h-1 bg-honey transition-all" style={{ width: `${Math.min((stepNumber / 6) * 100, 95)}%` }} />
      </div>

      <div className="px-4 pt-6 pb-3">
        <h2 className="font-serif text-lg font-semibold text-brown">{t(node.question)}</h2>
      </div>

      {currentNodeId === 'root' && prefilledNodeId && (
        <div className="px-4 mb-1">
          <button
            onClick={() => { haptics.tap(); setHistory(['root']); setCurrentNodeId(prefilledNodeId) }}
            className="w-full text-left bg-amber-50 border border-honey rounded-xl px-5 py-3 text-brown text-sm font-semibold"
          >
            🔍 {t(s.diagnose_from_inspection)}
          </button>
        </div>
      )}

      <div className="px-4 flex flex-col gap-3">
        {node.options.map((option) => (
          <button
            key={option.next}
            onClick={() => handleSelect(option.next)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown text-sm font-medium shadow-sm active:bg-amber-50 transition-colors leading-snug"
          >
            {t(option.label)}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button onClick={handleReset} className="text-sm text-brown-mid underline underline-offset-2">
          {t(s.diagnose_restart)}
        </button>
      </div>
    </div>
  )
}
