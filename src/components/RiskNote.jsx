import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

/**
 * Renders a bee-welfare risk note and mitigation.
 *
 * Two supported levels:
 *  - "caution" (amber): informational, do this thoughtfully
 *  - "warning" (red):   serious, must follow the mitigation
 *
 * `risk` shape:
 *   {
 *     level: 'caution' | 'warning',
 *     note: { de, en },
 *     mitigation: { de, en }
 *   }
 */
export default function RiskNote({ risk }) {
  const { t } = useLanguage()
  if (!risk) return null

  const isWarning = risk.level === 'warning'
  const container = isWarning
    ? 'border-red-300 bg-red-50 text-red-900'
    : 'border-amber-300 bg-amber-50 text-brown'
  const icon = isWarning ? '⚠️' : '🐝'
  const label = isWarning ? t(s.risk_warning_label) : t(s.risk_caution_label)

  return (
    <div
      role="note"
      aria-label={label}
      className={`mt-3 rounded-xl border p-3 text-sm leading-relaxed ${container}`}
    >
      <p className="font-semibold flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </p>
      <p className="mt-1">{t(risk.note)}</p>
      {risk.mitigation && (
        <>
          <p className="mt-2 font-semibold text-xs uppercase tracking-wide opacity-80">
            {t(s.risk_mitigation)}
          </p>
          <p className="mt-1">{t(risk.mitigation)}</p>
        </>
      )}
    </div>
  )
}
