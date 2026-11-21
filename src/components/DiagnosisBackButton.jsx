import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

// One step back in the diagnosis flow. Disabled (not hidden) on the first
// question so the layout does not jump. The 44px target is real size.
export default function DiagnosisBackButton({ onBack, disabled, className = '', style }) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={onBack}
      disabled={disabled}
      aria-label={t(s.diagnose_back)}
      className={`inline-flex min-h-11 min-w-11 items-center gap-1 px-2 text-sm font-medium disabled:opacity-40 ${className}`}
      style={style}
    >
      <span aria-hidden="true">‹</span>
      {t(s.diagnose_back)}
    </button>
  )
}
