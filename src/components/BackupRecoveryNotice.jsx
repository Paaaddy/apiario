import { useDataPort } from '../hooks/useDataPort'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import { getRecoveryCause } from '../utils/storageTransaction'

export default function BackupRecoveryNotice() {
  const { canRecover, recoverPreviousData } = useDataPort()
  const { t } = useLanguage()
  if (!canRecover) return null
  return (
    <div role="alert" className="shrink-0 border-b border-honey-dark bg-cream p-3 text-brown">
      <p className="text-sm font-semibold">{t(getRecoveryCause() === 'mutation' ? s.storage_recovery : s.data_import_error_recovery)}</p>
      <button type="button" onClick={recoverPreviousData} className="mt-2 rounded-lg bg-honey px-3 py-2 font-semibold text-brown">
        {t(s.data_import_recover)}
      </button>
    </div>
  )
}
