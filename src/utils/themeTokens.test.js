import { describe, it, expect } from 'vitest'
import { THEME_PALETTES, themeColors } from './themeTokens'

const REQUIRED_KEYS = [
  'bg', 'ink', 'inkMid', 'inkLight', 'accent', 'accentDark', 'rule',
  'cardBg', 'navBg', 'headerBg', 'border', 'formBg', 'formInk',
  'formInkMid', 'formInputBg', 'queenActiveBg', 'queenActiveColor',
  'temperActiveBg', 'addBtnBg', 'addBtnClr', 'inspectionCardBg',
  'cardBorder', 'scaleBorder', 'scaleActiveBg', 'scaleColor',
  'diagnoseBg', 'done',
  'tabActiveBg', 'tabActiveColor', 'tabInactiveColor',
  'navActiveColor', 'navInactiveColor', 'navHex',
]

describe('themeTokens', () => {
  it('defines palettes for all three themes with the required keys', () => {
    for (const theme of ['a', 'b', 'c']) {
      const p = THEME_PALETTES[theme]
      expect(p).toBeDefined()
      for (const key of REQUIRED_KEYS) {
        expect(typeof p[key]).toBe('string')
        expect(p[key].length).toBeGreaterThan(0)
      }
    }
  })

  it('falls back to theme A for an unknown theme', () => {
    expect(themeColors('nope')).toBe(THEME_PALETTES.a)
  })

  it('mirrors the CSS-defined core palette for each theme', () => {
    expect(THEME_PALETTES.a).toMatchObject({
      bg: '#fffbeb',
      ink: '#3d1f00',
      inkMid: '#92400e',
      inkLight: '#7a3f00',
      accent: '#f5a623',
      accentDark: '#e8890c',
      rule: '#f0e4c2',
    })
    expect(THEME_PALETTES.b).toMatchObject({
      bg: '#f4ecd8',
      ink: '#2b1d0e',
      inkMid: '#6b5838',
      inkLight: '#98876b',
      accent: '#c98a1e',
      accentDark: '#a57018',
      rule: '#c8b890',
    })
    expect(THEME_PALETTES.c).toMatchObject({
      bg: '#faf6ee',
      ink: '#1c1410',
      inkMid: '#6b5843',
      inkLight: '#9b8b7a',
      accent: '#f5a623',
      accentDark: '#d4800a',
      rule: 'rgba(28,20,16,0.1)',
    })
  })

  it('differentiates theme b and c from theme a where appropriate', () => {
    expect(THEME_PALETTES.b.bg).not.toBe(THEME_PALETTES.a.bg)
    expect(THEME_PALETTES.c.bg).not.toBe(THEME_PALETTES.a.bg)
    expect(THEME_PALETTES.b.inkMid).not.toBe(THEME_PALETTES.a.inkMid)
    expect(THEME_PALETTES.c.inkMid).not.toBe(THEME_PALETTES.a.inkMid)
    expect(THEME_PALETTES.b.rule).not.toBe(THEME_PALETTES.a.rule)
    expect(THEME_PALETTES.c.rule).not.toBe(THEME_PALETTES.a.rule)
  })

  it('theme c form opens with a dark palette against light a/b forms', () => {
    expect(THEME_PALETTES.c.formBg).toBe('#1c1410')
    expect(THEME_PALETTES.c.formInk).toBe('#ffffff')
    expect(THEME_PALETTES.a.formBg).toBe('#ffffff')
    expect(THEME_PALETTES.b.formBg).toBe('#f4ecd8')
  })
})
