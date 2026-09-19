import { buildBackup, parseBackup } from './dataBackup'

export function exportData() {
  return buildBackup()
}

export function importData(raw) {
  return parseBackup(raw)
}
