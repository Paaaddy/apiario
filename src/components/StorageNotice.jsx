import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function StorageNotice({ onRetry }) {
  const { t } = useLanguage()
  return (
    <div role="alert" className="shrink-0 border-b border-honey-dark bg-cream p-3 text-brown">
      <p className="text-sm font-semibold">{t(s.storage_error)}</p>
      <button type="button" onClick={onRetry} className="mt-2 rounded-lg bg-honey px-3 py-2 font-semibold text-brown">
        {t(s.storage_retry)}
      </button>
    </div>
  )
}
