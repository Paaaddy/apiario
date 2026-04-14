import { useState, useCallback } from 'react'

const STORAGE_KEY = 'apiario-profile'
const SCHEMA_VERSION = 1

const DEFAULT_PROFILE = {
  schemaVersion: SCHEMA_VERSION,
  hiveCount: null,
  climateZone: null,
  experience: null,
  onboardingDone: false,
}

function migrate(profile) {
  const v = profile.schemaVersion ?? 0
  // v0 → v1: first versioned schema, no field changes needed
  if (v < 1) {
    profile = { ...profile, schemaVersion: 1 }
  }
  return profile
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw)
    const merged = { ...DEFAULT_PROFILE, ...parsed }
    return merged.schemaVersion === SCHEMA_VERSION ? merged : migrate(merged)
  } catch {
    return DEFAULT_PROFILE
  }
}

export function useProfile() {
  const [profile, setProfile] = useState(loadProfile)

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { profile, updateProfile }
}
