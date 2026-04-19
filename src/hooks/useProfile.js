import { useState, useCallback } from 'react'

const STORAGE_KEY = 'apiario-profile'
const SCHEMA_VERSION = 2

const DEFAULT_PROFILE = {
  schemaVersion: SCHEMA_VERSION,
  hiveCount: null,
  climateZone: null,
  experience: null,
  onboardingDone: false,
  colonies: [],
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function nextColonyId(existing) {
  // Monotonically increasing numeric suffix, independent of array order.
  let max = 0
  for (const c of existing) {
    const m = /^col-(\d+)$/.exec(c.id ?? '')
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `col-${max + 1}`
}

/**
 * Migrate an incoming profile to the current schema. The migration is
 * idempotent: running it on an already-current profile is a no-op.
 */
function migrate(profile) {
  let p = { ...profile }
  let v = p.schemaVersion ?? 0

  // v0 → v1: first versioned schema.
  if (v < 1) {
    p.schemaVersion = 1
    v = 1
  }

  // v1 → v2: add a `colonies` array, seeded from `hiveCount` if present.
  if (v < 2) {
    const count = Math.max(0, Number(p.hiveCount) || 0)
    const createdAt = today()
    p.colonies = Array.from({ length: count }, (_, i) => ({
      id: `col-${i + 1}`,
      name: `Hive ${i + 1}`,
      createdAt,
      notes: '',
    }))
    p.schemaVersion = 2
    v = 2
  }

  return p
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw)
    // IMPORTANT: detect the schema version from the PARSED data, not from the
    // merged-with-defaults version — otherwise the defaults' schemaVersion
    // would hide the fact that stored data is an older version.
    const storedVersion = parsed.schemaVersion ?? 0
    const migrated = storedVersion === SCHEMA_VERSION ? parsed : migrate(parsed)
    // Fill in any keys that newer schema versions introduced but the stored
    // object never had.
    return { ...DEFAULT_PROFILE, ...migrated }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function useProfile() {
  const [profile, setProfile] = useState(loadProfile)

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const addColony = useCallback((name, notes = '') => {
    setProfile((prev) => {
      const existing = prev.colonies ?? []
      const colony = {
        id: nextColonyId(existing),
        name: (name ?? '').trim() || `Hive ${existing.length + 1}`,
        createdAt: today(),
        notes,
      }
      const next = { ...prev, colonies: [...existing, colony] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateColony = useCallback((id, updates) => {
    setProfile((prev) => {
      const colonies = (prev.colonies ?? []).map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
      const next = { ...prev, colonies }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeColony = useCallback((id) => {
    setProfile((prev) => {
      const colonies = (prev.colonies ?? []).filter((c) => c.id !== id)
      const next = { ...prev, colonies }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { profile, updateProfile, addColony, updateColony, removeColony }
}
