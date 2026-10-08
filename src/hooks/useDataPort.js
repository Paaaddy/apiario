import { useCallback, useRef, useSyncExternalStore } from 'react'
import { exportData as buildExport } from '../utils/dataPort'
import { backupErrorOutcome, exportBackupOutcome, hasBackupRecovery, recoverBackup, restoreBackup, subscribeBackupRecovery } from '../utils/dataBackup'
import { MAX_BACKUP_BYTES } from '../utils/backupLimits'

function triggerDownload(data) {
  const date = new Date().toISOString().split('T')[0]
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `apiario-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useDataPort() {
  const canRecover = useSyncExternalStore(subscribeBackupRecovery, hasBackupRecovery)
  const importingRef = useRef(false)
  const exportData = useCallback(() => {
    const data = buildExport()
    triggerDownload(data)
    return data
  }, [])

  const exportBackup = useCallback(() => {
    if (hasBackupRecovery()) return backupErrorOutcome('recovery')
    const data = buildExport()
    triggerDownload(data)
    return exportBackupOutcome(data)
  }, [])

  const importData = useCallback(async (file) => {
    if (hasBackupRecovery()) return backupErrorOutcome('recovery')
    if (importingRef.current) return backupErrorOutcome('unexpected')
    if (file.size > MAX_BACKUP_BYTES) return backupErrorOutcome('size')
    importingRef.current = true
    try {
      const text = await file.text()
      return restoreBackup(text)
    } catch {
      return backupErrorOutcome('unexpected')
    } finally {
      importingRef.current = false
    }
  }, [])

  const recoverPreviousData = useCallback(() => recoverBackup(), [])

  return { exportData, exportBackup, importData, canRecover, recoverPreviousData }
}
