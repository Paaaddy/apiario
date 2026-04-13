import { useState, useCallback } from 'react'

const STORAGE_KEY = 'apiario-profile'

const DEFAULT_PROFILE = {
  hiveCount: null,
  climateZone: null,
  experience: null,
  onboardingDone: false,
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE
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
