import { strings as s } from '../i18n/strings'
import { buildSeededColonies } from './persistedSlices'

/**
 * Profile answers: the beginner's three answers (hive count, climate zone,
 * experience) and what completing onboarding does with them.
 *
 * `hiveCount` is a seed answer. Completing onboarding turns it into Colonies
 * once; afterwards the Colonies in the profile are the source of truth and
 * editing `hiveCount` later does not add or remove any.
 *
 * Option labels are translation entries; callers resolve them with `t()`.
 */

export const HIVE_COUNT_OPTIONS = [
  { label: s.hive_1, value: 1 },
  { label: s.hive_2, value: 2 },
  { label: s.hive_5, value: 5 },
  { label: s.hive_10, value: 10 },
]

export const CLIMATE_ZONE_OPTIONS = [
  { label: s.zone_northern, value: 'northern' },
  { label: s.zone_central, value: 'central' },
  { label: s.zone_mediterranean, value: 'mediterranean' },
  { label: s.zone_other, value: 'other' },
]

export const EXPERIENCE_OPTIONS = [
  { label: s.exp_0, value: 0 },
  { label: s.exp_1, value: 1 },
  { label: s.exp_2, value: 2 },
]

const WINTER_HINTS = {
  northern: s.climate_winter_hint,
  central: s.climate_winter_hint_central,
  mediterranean: s.climate_winter_hint_mediterranean,
}

/** Translation entry for the winter hint of a climate zone; unknown zones get the generic one. */
export function winterHintFor(zone) {
  return WINTER_HINTS[zone] ?? s.climate_winter_hint_other
}

/**
 * The profile after onboarding finishes with `answers`.
 * Colonies are seeded from `hiveCount` only when the profile has none.
 */
export function completeOnboarding(profile, answers) {
  const next = { ...profile, ...answers, onboardingDone: true }
  if ((profile.colonies ?? []).length === 0 && Number(answers.hiveCount) > 0) {
    next.colonies = buildSeededColonies(answers.hiveCount)
  }
  return next
}
