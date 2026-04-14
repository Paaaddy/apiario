import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import RiskNote from './RiskNote'

const URGENCY_STYLES = {
  urgent:    { key: 'urgency_urgent',    border: 'border-red-400',  badge: 'bg-red-100 text-red-700' },
  important: { key: 'urgency_important', border: 'border-honey',    badge: 'bg-amber-100 text-brown-mid' },
  routine:   { key: 'urgency_routine',   border: 'border-gray-200', badge: 'bg-gray-100 text-gray-500' },
}

function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = isoDate.split('-')
  return `${day}.${month}`
}

export default function TaskCard({ task, isChecked = false, checkedDate = null, onToggle }) {
  const { t } = useLanguage()
  const style = URGENCY_STYLES[task.urgency] ?? URGENCY_STYLES.routine
  const isSecret = task.secret === true
  const borderClass = isChecked
    ? 'border-green-400'
    : isSecret
      ? 'border-purple-400'
      : style.border

  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 ${borderClass} shadow-sm`}>
      <div className="flex items-start gap-3">
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={isChecked ? 'Uncheck task' : 'Check task'}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isChecked
                ? 'bg-green-400 border-green-400 text-white'
                : 'border-gray-300'
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
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-green-100 text-green-700">
                {t(s.done_badge)}{checkedDate ? ` · ${formatShortDate(checkedDate)}` : ''}
              </span>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${style.badge}`}>
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
                  <p className="font-semibold uppercase tracking-wide text-[11px] opacity-80">
                    {t(s.secret_unique_value)}
                  </p>
                  <p className="mt-1">{t(task.uniqueValue)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
