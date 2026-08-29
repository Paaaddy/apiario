import { useCallback } from 'react'
import {
  exportData as buildExport,
  importData as validateImport,
} from '../utils/dataPort'

const PROFILE_KEY = 'apiario-profile'
const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

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

  const importData = useCallback(async (file) => {
    let text
    try {
      text = await file.text()
    } catch {
      return { ok: false, error: 'unexpected' }
    }
    const result = validateImport(text)
    if (!result.ok) return result
    const writes = [
      safeSet(PROFILE_KEY, result.data.profile),
      safeSet(INSPECTIONS_KEY, result.data.inspections),
      safeSet(LOG_KEY, result.data.log),
    ]
    if (!writes.every(Boolean)) {
      return { ok: false, error: 'unexpected' }
    }
    return { ok: true }
  }, [])

  return { exportData, importData }
}
