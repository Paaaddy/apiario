import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateSeasonsTree } from './validateSeasons'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

const VALID_SEASONS = {
  spring: {
    label: { de: 'Frühling', en: 'Spring' },
    icon: '🌸',
    months: [3, 4, 5],
    tasks: [
      {
        id: 'sp-01',
        name: { de: 'Kontrolle', en: 'Inspect' },
        why: { de: 'Warum', en: 'Why' },
        urgency: 'important',
        minExperience: 0,
      },
      {
        id: 'sp-02',
        name: { de: 'Behandeln', en: 'Treat' },
        why: { de: 'Warum', en: 'Why' },
        urgency: 'routine',
        minExperience: 1,
        secret: true,
        unlockAt: 3,
        risk: {
          level: 'caution',
          note: { de: 'Hinweis', en: 'Note' },
          mitigation: { de: 'Massnahme', en: 'Mitigation' },
        },
      },
    ],
  },
}

describe('validateSeasonsTree', () => {
  it('valid data passes without warnings', () => {
    validateSeasonsTree(VALID_SEASONS)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('season missing required fields is flagged', () => {
    const data = {
      summer: {
        months: [6, 7, 8],
        tasks: [],
      },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[summer] missing \'label\'')
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[summer] missing \'icon\'')
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[summer] missing or empty \'tasks\'')
    )
  })

  it('out-of-range months are flagged', () => {
    const data = {
      spring: { ...VALID_SEASONS.spring, months: [3, 13] },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('not an integer in 1–12')
    )
  })

  it('task missing required fields is flagged', () => {
    const data = {
      spring: {
        ...VALID_SEASONS.spring,
        tasks: [{ name: { de: 'x', en: 'x' } }],
      },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("missing 'id'")
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("missing 'why'")
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("missing 'urgency'")
    )
  })

  it('duplicate task ids are flagged', () => {
    const task = {
      id: 'sp-01',
      name: { de: 'x', en: 'x' },
      why: { de: 'warum', en: 'why' },
      urgency: 'routine',
      minExperience: 0,
    }
    const data = {
      spring: { ...VALID_SEASONS.spring, tasks: [task, task] },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("duplicate id: 'sp-01'")
    )
  })

  it('bad urgency is flagged', () => {
    const data = {
      spring: {
        ...VALID_SEASONS.spring,
        tasks: [
          {
            id: 'sp-01',
            name: { de: 'x', en: 'x' },
            why: { de: 'warum', en: 'why' },
            urgency: 'critical',
            minExperience: 0,
          },
        ],
      },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("'urgency' not in {urgent, important, routine}")
    )
  })

  it('out-of-range minExperience is flagged', () => {
    const data = {
      spring: {
        ...VALID_SEASONS.spring,
        tasks: [
          {
            id: 'sp-01',
            name: { de: 'x', en: 'x' },
            why: { de: 'warum', en: 'why' },
            urgency: 'routine',
            minExperience: 5,
          },
        ],
      },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("'minExperience' outside 0–2")
    )
  })

  it('malformed secret unlockAt is flagged', () => {
    const data = {
      spring: {
        ...VALID_SEASONS.spring,
        tasks: [
          {
            id: 'sp-01',
            name: { de: 'x', en: 'x' },
            why: { de: 'warum', en: 'why' },
            urgency: 'routine',
            minExperience: 0,
            secret: true,
            unlockAt: 'soon',
          },
        ],
      },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("'secret' present but 'unlockAt' malformed")
    )
  })

  it('malformed risk is flagged', () => {
    const data = {
      spring: {
        ...VALID_SEASONS.spring,
        tasks: [
          {
            id: 'sp-01',
            name: { de: 'x', en: 'x' },
            why: { de: 'warum', en: 'why' },
            urgency: 'routine',
            minExperience: 0,
            risk: { level: 'extreme' },
          },
        ],
      },
    }
    validateSeasonsTree(data)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("'risk' present but missing 'note' or 'mitigation'")
    )
  })
})
