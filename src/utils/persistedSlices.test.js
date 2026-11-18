import { afterEach } from 'vitest'
import { SLICES, loadSlice } from './persistedSlices'

afterEach(() => localStorage.clear())

describe('persisted slices', () => {
  it('names every slice that Apiario persists, with its storage key', () => {
    expect(Object.fromEntries(Object.entries(SLICES).map(([name, slice]) => [name, slice.key])))
      .toEqual({
        profile: 'apiario-profile',
        inspections: 'apiario-inspections',
        log: 'apiario-log',
      })
  })

  it('loads the fallback when nothing is stored', () => {
    expect(loadSlice(SLICES.inspections)).toMatchObject({ value: [], unsafe: false })
    expect(loadSlice(SLICES.profile).value).toMatchObject({ onboardingDone: false, colonies: [] })
  })

  it('migrates a version-1 profile by seeding colonies from hiveCount', () => {
    localStorage.setItem('apiario-profile', JSON.stringify({ hiveCount: 2, climateZone: 'central' }))
    const { value, unsafe } = loadSlice(SLICES.profile)
    expect(unsafe).toBe(false)
    expect(value.schemaVersion).toBe(3)
    expect(value.colonies.map((colony) => colony.id)).toEqual(['col-1', 'col-2'])
  })

  it('keeps sound records visible but marks the slice unsafe when one record is malformed', () => {
    localStorage.setItem('apiario-inspections', JSON.stringify([
      { id: 'ok', colonyId: 'c1' },
      { id: 'bad', colonyId: '' },
    ]))
    const { value, unsafe } = loadSlice(SLICES.inspections)
    expect(value.map((inspection) => inspection.id)).toEqual(['ok'])
    expect(unsafe).toBe(true)
  })

  it('caps the stored task log to the retention limit on load', () => {
    const entries = Array.from({ length: 600 }, (_, index) => ({ id: `l${index}`, type: 'custom', text: 'x' }))
    localStorage.setItem('apiario-log', JSON.stringify(entries))
    expect(loadSlice(SLICES.log).value.length).toBeLessThan(600)
  })
})
