import { memo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import RiskNote from './RiskNote'

const URGENCY_STYLES = {
  urgent:    { key: 'urgency_urgent',    border: 'border-red-400',  badge: 'bg-red-100 text-red-700',     color: '#c23b22' },
  important: { key: 'urgency_important', border: 'border-honey',    badge: 'bg-amber-100 text-brown-mid', color: '#c98a1e' },
  routine:   { key: 'urgency_routine',   border: 'border-gray-200', badge: 'bg-gray-100 text-gray-500',   color: '#98876b' },
}

function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = isoDate.split('-')
  return `${day}.${month}`
}

const TaskCard = memo(function TaskCard({ task, isChecked = false, checkedDate = null, onToggle, inGlassContainer = false }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const style = URGENCY_STYLES[task.urgency] ?? URGENCY_STYLES.routine
  const isSecret = task.secret === true

  if (theme === 'b') {
    const dotColor = isChecked ? '#6f7f56' : style.color
    return (
      <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(200,184,144,0.4)', display: 'flex', gap: 14 }}>
        <div style={{ width: 22, flexShrink: 0, paddingTop: 4 }}>
          {onToggle ? (
            <button
              onClick={onToggle}
              aria-label={isChecked ? 'Uncheck task' : 'Check task'}
              style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `1.5px solid ${isChecked ? '#6f7f56' : '#98876b'}`,
                background: isChecked ? '#6f7f56' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              {isChecked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>}
            </button>
          ) : (
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `1.5px solid ${isChecked ? '#6f7f56' : '#98876b'}`,
              background: isChecked ? '#6f7f56' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isChecked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
            {!isChecked && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />}
            <span style={{ fontFamily: 'var(--theme-font-mono)', fontSize: 9.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: isChecked ? '#6f7f56' : dotColor, fontWeight: 600 }}>
              {isChecked ? `${t(s.done_badge)}${checkedDate ? ` · ${formatShortDate(checkedDate)}` : ''}` : t(s[style.key])}
            </span>
          </div>
          <h3 style={{ margin: 0, fontFamily: 'var(--theme-font-head)', fontSize: 19, fontWeight: 500, lineHeight: 1.2, color: isChecked ? '#98876b' : '#2b1d0e', textDecoration: isChecked ? 'line-through' : 'none', fontStyle: isChecked ? 'italic' : 'normal' }}>
            {t(task.name)}
          </h3>
          {!isChecked && (
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.55, color: '#6b5838', fontFamily: 'var(--theme-font-head)' }}>
              {t(task.why)}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (theme === 'c') {
    const urgencyColor = isChecked ? '#7a9b50' : (task.urgency === 'urgent' ? '#c23b22' : task.urgency === 'important' ? '#d4800a' : '#6b5843')
    return (
      <div style={{ padding: '12px 12px', borderBottom: '1px solid rgba(28,20,16,0.07)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {onToggle ? (
          <button
            onClick={onToggle}
            aria-label={isChecked ? 'Uncheck task' : 'Check task'}
            style={{ marginTop: 2, flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: isChecked ? '#7a9b50' : 'transparent', border: isChecked ? 'none' : '1.5px solid rgba(107,88,67,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            {isChecked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
          </button>
        ) : (
          <div style={{ marginTop: 2, flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: isChecked ? '#7a9b50' : 'transparent', border: isChecked ? 'none' : '1.5px solid rgba(107,88,67,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isChecked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: urgencyColor, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: urgencyColor }}>
              {isChecked ? `${t(s.done_badge)}${checkedDate ? ` · ${formatShortDate(checkedDate)}` : ''}` : t(s[style.key])}
            </span>
          </div>
          <h3 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 400, lineHeight: 1.15, color: isChecked ? 'rgba(28,20,16,0.35)' : '#1c1410', textDecoration: isChecked ? 'line-through' : 'none' }}>
            {t(task.name)}
          </h3>
          {!isChecked && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#6b5843', lineHeight: 1.45 }}>{t(task.why)}</p>}
        </div>
      </div>
    )
  }

  // Theme A: card with hex urgency pill and left border
  const borderClass = isChecked ? 'border-green-400' : isSecret ? 'border-purple-400' : style.border

  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 ${borderClass} shadow-sm`}>
      <div className="flex items-start gap-3">
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={isChecked ? 'Uncheck task' : 'Check task'}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isChecked ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300'
            }`}
          >
            {isChecked && (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          {isSecret && !isChecked && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 mb-1">
              <span aria-hidden="true">✨</span>
              <span>{t(s.secret_badge)}</span>
            </span>
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className={`font-serif text-base font-semibold leading-snug flex-1 ${isChecked ? 'line-through text-brown/40' : 'text-brown'}`}>
              {t(task.name)}
            </h3>
            {isChecked ? (
              <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 px-2.5 py-1 bg-green-100 text-green-700"
                style={{ clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)' }}>
                {t(s.done_badge)}{checkedDate ? ` · ${formatShortDate(checkedDate)}` : ''}
              </span>
            ) : (
              <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2.5 py-1 ${isSecret ? 'bg-purple-100 text-purple-700' : style.badge}`}
                style={{ clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)' }}>
                {t(s[style.key])}
              </span>
            )}
          </div>
          {!isChecked && (
            <>
              <p className="mt-1.5 text-sm text-brown-mid leading-relaxed">{t(task.why)}</p>
              <RiskNote risk={task.risk} />
              {isSecret && task.uniqueValue && (
                <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs leading-relaxed text-purple-900">
                  <p className="font-semibold uppercase tracking-wide text-[11px] opacity-80">{t(s.secret_unique_value)}</p>
                  <p className="mt-1">{t(task.uniqueValue)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}, (prev, next) =>
  prev.task.id === next.task.id &&
  prev.isChecked === next.isChecked &&
  prev.checkedDate === next.checkedDate &&
  prev.inGlassContainer === next.inGlassContainer
)

export default TaskCard
