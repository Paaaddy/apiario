import { useCallback } from 'react'
import { exportData as buildExport } from '../utils/dataPort'
import { exportBackupOutcome, restoreBackup } from '../utils/dataBackup'

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
  const exportData = useCallback(() => {
    const data = buildExport()
    triggerDownload(data)
    return data
  }, [])

  const exportBackup = useCallback(() => {
    const data = buildExport()
    triggerDownload(data)
    return exportBackupOutcome(data)
  }, [])

  const importData = useCallback(async (file) => {
    let text
    try {
      text = await file.text()
    } catch {
      return { ok: false, error: 'unexpected' }
    }
    return restoreBackup(text)
  }, [])

  return { exportData, exportBackup, importData }
}
