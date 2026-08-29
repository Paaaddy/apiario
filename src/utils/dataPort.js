const PROFILE_KEY = 'apiario-profile'
const INSPECTIONS_KEY = 'apiario-inspections'
const LOG_KEY = 'apiario-log'

const FORMAT = 'apiario-backup'
const SCHEMA_VERSION = 2

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function exportData() {
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      profile: readJSON(PROFILE_KEY, {}),
      inspections: readJSON(INSPECTIONS_KEY, []),
      log: readJSON(LOG_KEY, []),
    },
  }
}

export function importData(raw) {
  try {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'parse' }
    }
    if (!parsed || parsed.format !== FORMAT || !parsed.data) {
      return { ok: false, error: 'format' }
    }
    return {
      ok: true,
      data: {
        profile: parsed.data.profile ?? {},
        inspections: Array.isArray(parsed.data.inspections)
          ? parsed.data.inspections
          : [],
        log: Array.isArray(parsed.data.log) ? parsed.data.log : [],
      },
    }
  } catch {
    return { ok: false, error: 'unexpected' }
  }
}
