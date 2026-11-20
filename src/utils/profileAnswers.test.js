import { describe, expect, it } from 'vitest'
import { strings as s } from '../i18n/strings'
import { CLIMATE_ZONE_OPTIONS, completeOnboarding, EXPERIENCE_OPTIONS, HIVE_COUNT_OPTIONS, winterHintFor } from './profileAnswers'
import { isProfile } from './persistedSlices'

describe('answer vocabulary', () => {
  it('only offers values a stored profile accepts', () => {
    for (const option of HIVE_COUNT_OPTIONS) expect(isProfile({ hiveCount: option.value })).toBe(true)
    for (const option of CLIMATE_ZONE_OPTIONS) expect(isProfile({ climateZone: option.value })).toBe(true)
    for (const option of EXPERIENCE_OPTIONS) expect(isProfile({ experience: option.value })).toBe(true)
  })

  it('gives every zone its own winter hint and unknown zones the generic one', () => {
    expect(winterHintFor('northern')).toBe(s.climate_winter_hint)
    expect(winterHintFor('central')).toBe(s.climate_winter_hint_central)
    expect(winterHintFor('mediterranean')).toBe(s.climate_winter_hint_mediterranean)
    expect(winterHintFor('other')).toBe(s.climate_winter_hint_other)
    expect(winterHintFor(null)).toBe(s.climate_winter_hint_other)
  })
})

describe('completeOnboarding', () => {
  it('records answers, marks onboarding done and seeds Colonies from hiveCount', () => {
    const next = completeOnboarding({ colonies: [] }, { hiveCount: 2, climateZone: 'central', experience: 1 })
    expect(next).toMatchObject({ hiveCount: 2, climateZone: 'central', experience: 1, onboardingDone: true })
    expect(next.colonies.map((c) => c.id)).toEqual(['col-1', 'col-2'])
  })

  it('keeps existing Colonies instead of seeding over them', () => {
    const colonies = [{ id: 'col-9', name: 'Mine' }]
    expect(completeOnboarding({ colonies }, { hiveCount: 5 }).colonies).toBe(colonies)
  })

  it('seeds nothing when hiveCount was skipped', () => {
    const next = completeOnboarding({ colonies: [] }, {})
    expect(next.colonies).toEqual([])
    expect(next.onboardingDone).toBe(true)
  })

  it('treats a profile without a colonies list as having none', () => {
    expect(completeOnboarding({}, { hiveCount: 1 }).colonies).toHaveLength(1)
  })
})
