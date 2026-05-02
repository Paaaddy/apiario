import LanguageToggle from './LanguageToggle'
import { strings as s } from '../i18n/strings'

function getSeasonPalette(date) {
  const m = date.getMonth() + 1
  if (m >= 3 && m <= 5) return { sun: '#f5a623', bloom: '#e87ba0', leaf: '#7a9b50', sunDeep: '#d4800a' }
  if (m >= 6 && m <= 8) return { sun: '#f0a820', bloom: '#e8a93a', leaf: '#8a9b50', sunDeep: '#c07a0a' }
  if (m >= 9 && m <= 11) return { sun: '#c45a1c', bloom: '#a83a24', leaf: '#8b5c30', sunDeep: '#8b3a0f' }
  return { sun: '#6b8fa6', bloom: '#4a6b80', leaf: '#3a5b70', sunDeep: '#2a4b60' }
}

export default function SeasonHeader({ theme, selectedDate, icon, label, week, rangeLabel, taskCount, viewingToday, locale, t, onPrev, onNext, onToday }) {
  if (theme === 'c') {
    const pal = getSeasonPalette(selectedDate)
    return (
      <>
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: pal.sun + 'e8', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1c1410', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{icon}</span> {t(label)} · {t(s.season_week)} {week}
          </div>
          <LanguageToggle />
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 220 }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 140% 80% at 30% 0%, ${pal.sun}dd 0%, ${pal.sun}88 30%, transparent 60%), radial-gradient(ellipse 100% 70% at 80% 20%, ${pal.bloom}66 0%, transparent 50%), radial-gradient(ellipse 120% 100% at 50% 100%, ${pal.leaf}33 0%, transparent 70%), linear-gradient(180deg, ${pal.sun} 0%, #f2bd5e 40%, #faf6ee 100%)` }} />
          <div style={{ position: 'absolute', top: 60, left: -50, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, #ffe9a8 0%, ${pal.sun} 50%, ${pal.sunDeep} 100%)`, filter: 'blur(1px)', opacity: 0.85 }} />
          <div style={{ position: 'relative', padding: '12px 22px 24px', zIndex: 2 }}>
            <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 58, lineHeight: 0.92, fontWeight: 700, color: '#1c1410', letterSpacing: -1 }}>
              {viewingToday
                ? (locale === 'de' ? <>Diese<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>Woche.</span></> : <>This<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>week.</span></>)
                : (locale === 'de' ? <>Woche<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>{week}.</span></> : <>Week<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>{week}.</span></>)
              }
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#1c1410', maxWidth: '80%' }}>
              {rangeLabel} · {taskCount} {t(s.season_tasks_noun)}
            </p>
          </div>
        </div>
        <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={onPrev} aria-label={t(s.week_previous)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(28,20,16,0.12)', color: '#1c1410', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>‹</button>
          <div style={{ flex: 1 }} />
          {!viewingToday && (
            <button type="button" onClick={onToday} style={{ fontSize: 11, fontWeight: 600, color: '#d4800a', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>{t(s.week_today)}</button>
          )}
          <button type="button" onClick={onNext} aria-label={t(s.week_next)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(28,20,16,0.12)', color: '#1c1410', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>›</button>
        </div>
      </>
    )
  }

  // Theme B: Field Notebook
  return (
    <div style={{ padding: '42px 24px 12px', position: 'sticky', top: 0, zIndex: 20, background: '#f4ecd8', borderBottom: '1px solid #c8b890' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontFamily: 'var(--theme-font-mono)', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b5838' }}>
          {t(label)} · {t(s.season_week)} {week}{rangeLabel ? ` · ${rangeLabel}` : ''}
        </p>
        <LanguageToggle />
      </div>
      <h1 style={{ margin: '14px 0 4px', fontFamily: 'var(--theme-font-head)', fontSize: 42, lineHeight: 0.95, fontWeight: 400, color: '#2b1d0e', letterSpacing: -0.5 }}>
        {icon}{viewingToday
          ? (locale === 'de' ? <> <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Diese Woche.</span></> : <> <span style={{ fontStyle: 'italic', fontWeight: 300 }}>This week.</span></>)
          : (locale === 'de' ? <> <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Woche {week}.</span></> : <> <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Week {week}.</span></>)
        }
      </h1>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b5838', fontFamily: 'var(--theme-font-head)' }}>
        {taskCount} {t(s.season_tasks_noun)}
      </p>
      <div style={{ marginTop: 12, padding: '8px 0', borderTop: '1px solid #c8b890', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" onClick={onPrev} aria-label={t(s.week_previous)} style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 11, color: '#6b5838', letterSpacing: 1, background: 'none', border: 'none', cursor: 'pointer' }}>‹ {t(s.week_previous)}</button>
        {!viewingToday && (
          <button type="button" onClick={onToday} style={{ fontSize: 11, fontWeight: 600, color: '#c98a1e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>{t(s.week_today)}</button>
        )}
        <button type="button" onClick={onNext} aria-label={t(s.week_next)} style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 11, color: '#6b5838', letterSpacing: 1, background: 'none', border: 'none', cursor: 'pointer' }}>{t(s.week_next)} ›</button>
      </div>
    </div>
  )
}
