import { useSyncExternalStore } from 'react'
import { applyPendingUpdate, getReloadStatus, subscribeReloadStatus } from '../pwa/reloadSafety'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function UpdateNotice() {
  const { t } = useLanguage()
  const { pending, blocked } = useSyncExternalStore(subscribeReloadStatus, getReloadStatus)
  if (!pending) return null
  return (
    <div role="status" className="shrink-0 border-b border-honey-dark bg-cream p-3 text-brown">
      <p className="text-sm font-semibold">{t(blocked ? s.update_deferred : s.update_ready)}</p>
      {!blocked && <button type="button" onClick={applyPendingUpdate} className="mt-2 rounded-lg bg-honey px-3 py-2 font-semibold text-brown">{t(s.update_apply)}</button>}
    </div>
  )
}
