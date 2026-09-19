import { useCallback, useState } from 'react'
import { useDataPort } from './useDataPort'
import { strings as s } from '../i18n/strings'

function messageFor(result, t) {
  return t(s[result.messageKey])
}

export function useBackupRestoreController(t, reload = () => window.location.reload()) {
  const { exportBackup, importData } = useDataPort()
  const [status, setStatus] = useState(null)

  const exportBackupFile = useCallback(() => {
    const result = exportBackup()
    setStatus({
      kind: result.ok ? 'success' : 'error',
      message: messageFor(result, t),
    })
    return result
  }, [exportBackup, t])

  const restoreBackupFile = useCallback(async (file) => {
    if (!file) return null
    const result = await importData(file)
    setStatus({
      kind: result.ok ? 'success' : 'error',
      message: messageFor(result, t),
    })
    if (result.ok && result.requiresReload) reload()
    return result
  }, [importData, reload, t])

  const restoreFromInput = useCallback(async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    return restoreBackupFile(file)
  }, [restoreBackupFile])

  return {
    status,
    exportBackupFile,
    restoreBackupFile,
    restoreFromInput,
  }
}
