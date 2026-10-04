import { useCallback, useState } from 'react'
import { useDataPort } from './useDataPort'
import { backupErrorOutcome } from '../utils/dataBackup'
import { strings as s } from '../i18n/strings'

function messageFor(result, t) {
  return t(s[result.messageKey])
}

export function useBackupRestoreController(t, reload = () => window.location.reload()) {
  const { exportBackup, importData, canRecover, recoverPreviousData: recover } = useDataPort()
  const [outcome, setOutcome] = useState(() => canRecover ? backupErrorOutcome('recovery') : null)
  const displayedOutcome = outcome?.error === 'recovery' && !canRecover
    ? { ok: true, messageKey: 'data_import_recovered' }
    : outcome
  const status = displayedOutcome ? { kind: displayedOutcome.ok ? 'success' : 'error', message: messageFor(displayedOutcome, t) } : null

  const exportBackupFile = useCallback(() => {
    const result = exportBackup()
    setOutcome(result)
    return result
  }, [exportBackup])

  const restoreBackupFile = useCallback(async (file) => {
    if (!file) return null
    const result = await importData(file)
    setOutcome(result)
    if (result.ok && result.requiresReload) reload()
    return result
  }, [importData, reload])

  const restoreFromInput = useCallback(async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    return restoreBackupFile(file)
  }, [restoreBackupFile])

  const recoverPreviousData = useCallback(() => {
    const result = recover()
    setOutcome(result)
    return result
  }, [recover])

  return {
    status,
    exportBackupFile,
    restoreBackupFile,
    restoreFromInput,
    canRecover,
    recoverPreviousData,
  }
}
