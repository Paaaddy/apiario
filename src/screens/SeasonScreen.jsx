import { useState, useCallback, useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { useSeason } from '../hooks/useSeason'
import { strings as s } from '../i18n/strings'
import TaskCard from '../components/TaskCard'
import HexWatermark from '../components/HexWatermark'
import LanguageToggle from '../components/LanguageToggle'
import { addWeeks, isSameIsoWeek } from '../utils/season'
import { haptics } from '../utils/haptics'

function formatDayMonth(date, locale) {
  if (!date) return ''
  const loc = locale === 'de' ? 'de-DE' : 'en-GB'
  return date.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
}

function getSeasonPalette(date) {
  const m = date.getMonth() + 1
  if (m >= 3 && m <= 5) return { sun: '#f5a623', bloom: '#e87ba0', leaf: '#7a9b50', sunDeep: '#d4800a' }
  if (m >= 6 && m <= 8) return { sun: '#f0a820', bloom: '#e8a93a', leaf: '#8a9b50', sunDeep: '#c07a0a' }
  if (m >= 9 && m <= 11) return { sun: '#c45a1c', bloom: '#a83a24', leaf: '#8b5c30', sunDeep: '#8b3a0f' }
  return { sun: '#6b8fa6', bloom: '#4a6b80', leaf: '#3a5b70', sunDeep: '#2a4b60' }
}

export default function SeasonScreen({ profile, log, completedTaskIds, onToggleTask }) {
  const { t, locale } = useLanguage()
  const { theme } = useTheme()
  const completedCount = completedTaskIds?.size ?? 0

  const logByTaskId = useMemo(() => {
    const map = new Map()
    log?.forEach(e => { if (e.type === 'task') map.set(e.taskId, e) })
    return map
  }, [log])

  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const today = useMemo(() => new Date(), [])
  const viewingToday = isSameIsoWeek(selectedDate, today)

  const { label, icon, week, weekRange, tasks, nextLockedSecret } = useSeason(
    profile,
    completedCount,
    selectedDate
  )

  const goPreviousWeek = useCallback(() => { haptics.tap(); setSelectedDate((d) => addWeeks(d, -1)) }, [])
  const goNextWeek    = useCallback(() => { haptics.tap(); setSelectedDate((d) => addWeeks(d, 1))  }, [])
  const goToday       = useCallback(() => { haptics.tap(); setSelectedDate(new Date())               }, [])

  const rangeLabel =
    weekRange?.start && weekRange?.end
      ? `${formatDayMonth(weekRange.start, locale)} – ${formatDayMonth(weekRange.end, locale)}`
      : ''

  // ── Theme C: Seasonal Light ─────────────────────────────────────
  if (theme === 'c') {
    const pal = getSeasonPalette(selectedDate)
    return (
      <div style={{ position: 'relative', minHeight: '100%', background: '#faf6ee' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: pal.sun + 'e8', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1c1410', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{icon}</span> {t(label)} · {t(s.season_week)} {week}
          </div>
          <LanguageToggle />
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 220 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 140% 80% at 30% 0%, ${pal.sun}dd 0%, ${pal.sun}88 30%, transparent 60%), radial-gradient(ellipse 100% 70% at 80% 20%, ${pal.bloom}66 0%, transparent 50%), radial-gradient(ellipse 120% 100% at 50% 100%, ${pal.leaf}33 0%, transparent 70%), linear-gradient(180deg, ${pal.sun} 0%, #f2bd5e 40%, #faf6ee 100%)`,
          }} />
          <div style={{ position: 'absolute', top: 60, left: -50, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, #ffe9a8 0%, ${pal.sun} 50%, ${pal.sunDeep} 100%)`, filter: 'blur(1px)', opacity: 0.85 }} />

          <div style={{ position: 'relative', padding: '12px 22px 24px', zIndex: 2 }}>
            <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 58, lineHeight: 0.92, fontWeight: 700, color: '#1c1410', letterSpacing: -1 }}>
              {viewingToday
                ? (locale === 'de' ? <>Diese<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>Woche.</span></> : <>This<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>week.</span></>)
                : (locale === 'de' ? <>Woche<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>{week}.</span></> : <>Week<br/><span style={{ fontStyle: 'italic', fontWeight: 400 }}>{week}.</span></>)
              }
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#1c1410', maxWidth: '80%' }}>
              {rangeLabel} · {tasks.length} {t(s.season_tasks_noun)}
            </p>
          </div>
        </div>

        <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={goPreviousWeek} aria-label={t(s.week_previous)}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(28,20,16,0.12)', color: '#1c1410', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            ‹
          </button>
          <div style={{ flex: 1 }} />
          {!viewingToday && (
            <button type="button" onClick={goToday}
              style={{ fontSize: 11, fontWeight: 600, color: '#d4800a', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
              {t(s.week_today)}
            </button>
          )}
          <button type="button" onClick={goNextWeek} aria-label={t(s.week_next)}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(28,20,16,0.12)', color: '#1c1410', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            ›
          </button>
        </div>

        <div style={{ padding: '0 14px 120px' }}>
          {tasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b5843', padding: '2rem 0', fontFamily: '"Playfair Display", serif', fontSize: 18 }}>{t(s.season_nothing)}</p>
          ) : (
            <div style={{ background: 'rgba(255,251,240,0.72)', backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)', borderRadius: 22, border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 2px 4px rgba(61,31,0,0.06), 0 12px 36px rgba(61,31,0,0.10)', overflow: 'hidden' }}>
              {tasks.map((task) => {
                const logEntry = logByTaskId.get(task.id)
                return (
                  <TaskCard key={task.id} task={task} isChecked={completedTaskIds?.has(task.id) ?? false} checkedDate={logEntry?.completedAt ?? null} onToggle={onToggleTask ? () => onToggleTask(task) : undefined} inGlassContainer />
                )
              })}
            </div>
          )}
          {nextLockedSecret && (
            <div className="mt-4 rounded-xl border border-dashed border-purple-300 bg-purple-50/60 p-4 text-sm text-purple-900 text-center">
              <span className="text-xl mr-1" aria-hidden="true">🔒</span>
              {t(s.secret_locked_teaser).replace('{n}', String(Math.max(0, (nextLockedSecret.unlockAt ?? 0) - completedCount)))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Theme B: Field Notebook ──────────────────────────────────────
  if (theme === 'b') {
    return (
      <div style={{ minHeight: '100%', background: '#f4ecd8' }}>
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
            {tasks.length} {t(s.season_tasks_noun)}
          </p>
          <div style={{ marginTop: 12, padding: '8px 0', borderTop: '1px solid #c8b890', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={goPreviousWeek} aria-label={t(s.week_previous)}
              style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 11, color: '#6b5838', letterSpacing: 1, background: 'none', border: 'none', cursor: 'pointer' }}>
              ‹ {t(s.week_previous)}
            </button>
            {!viewingToday && (
              <button type="button" onClick={goToday}
                style={{ fontSize: 11, fontWeight: 600, color: '#c98a1e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                {t(s.week_today)}
              </button>
            )}
            <button type="button" onClick={goNextWeek} aria-label={t(s.week_next)}
              style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 11, color: '#6b5838', letterSpacing: 1, background: 'none', border: 'none', cursor: 'pointer' }}>
              {t(s.week_next)} ›
            </button>
          </div>
        </div>

        <div style={{ padding: '0 24px 120px' }}>
          {tasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b5838', padding: '2rem 0', fontFamily: 'var(--theme-font-head)', fontSize: 18, fontStyle: 'italic' }}>{t(s.season_nothing)}</p>
          ) : (
            tasks.map((task) => {
              const logEntry = logByTaskId.get(task.id)
              return (
                <TaskCard key={task.id} task={task} isChecked={completedTaskIds?.has(task.id) ?? false} checkedDate={logEntry?.completedAt ?? null} onToggle={onToggleTask ? () => onToggleTask(task) : undefined} />
              )
            })
          )}
          {nextLockedSecret && (
            <div style={{ marginTop: 16, padding: '12px', border: '1px dashed #c8b890', color: '#6b5838', textAlign: 'center', fontSize: 13, fontFamily: 'var(--theme-font-head)', fontStyle: 'italic' }}>
              🔒 {t(s.secret_locked_teaser).replace('{n}', String(Math.max(0, (nextLockedSecret.unlockAt ?? 0) - completedCount)))}
            </div>
          )}
          <div style={{ marginTop: 20, padding: '12px 0', textAlign: 'center', fontFamily: 'var(--theme-font-mono)', fontSize: 10, letterSpacing: '1.5px', color: '#98876b', textTransform: 'uppercase' }}>
            — {locale === 'de' ? 'Ende der Woche' : 'end of week'} —
          </div>
        </div>
      </div>
    )
  }

  // ── Theme A: Honeycomb (default) ─────────────────────────────────
  return (
    <div className="relative flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-brown-light text-xs uppercase tracking-widest font-medium mb-1">
              {t(label)} · {t(s.season_week)} {week}
            </p>
            <h1 className="font-serif text-3xl font-bold text-brown">
              {icon} {viewingToday ? t(s.season_this_week) : `${t(s.season_week)} ${week}`}
            </h1>
            <p className="text-brown-light text-sm mt-1">
              {tasks.length} {t(s.season_tasks_noun)}
            </p>
          </div>
          <LanguageToggle />
        </div>
        <div className="relative mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={goPreviousWeek} aria-label={t(s.week_previous)}
            className="shrink-0 w-9 h-9 rounded-full bg-white/70 border border-honey-dark/30 text-brown text-lg font-bold flex items-center justify-center active:bg-white">
            ‹
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm text-brown font-semibold leading-tight">{t(s.season_week)} {week}</p>
            <p className="text-[11px] text-brown-mid leading-tight">{rangeLabel}</p>
          </div>
          <button type="button" onClick={goNextWeek} aria-label={t(s.week_next)}
            className="shrink-0 w-9 h-9 rounded-full bg-white/70 border border-honey-dark/30 text-brown text-lg font-bold flex items-center justify-center active:bg-white">
            ›
          </button>
        </div>
        {!viewingToday && (
          <div className="relative mt-2 flex justify-center">
            <button type="button" onClick={goToday} className="text-xs font-semibold text-brown underline underline-offset-2">
              {t(s.week_today)}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-center text-brown-mid py-8 font-serif text-lg">{t(s.season_nothing)}</p>
        ) : (
          tasks.map((task) => {
            const logEntry = logByTaskId.get(task.id)
            return (
              <TaskCard key={task.id} task={task} isChecked={completedTaskIds?.has(task.id) ?? false} checkedDate={logEntry?.completedAt ?? null} onToggle={onToggleTask ? () => onToggleTask(task) : undefined} />
            )
          })
        )}
        {nextLockedSecret && (
          <div className="mt-2 rounded-xl border border-dashed border-purple-300 bg-purple-50/60 p-4 text-sm text-purple-900 text-center">
            <span className="text-xl mr-1" aria-hidden="true">🔒</span>
            {t(s.secret_locked_teaser).replace('{n}', String(Math.max(0, (nextLockedSecret.unlockAt ?? 0) - completedCount)))}
          </div>
        )}
      </div>
    </div>
  )
}
