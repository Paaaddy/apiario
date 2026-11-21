import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import LanguageToggle from './components/LanguageToggle'

/*
 * Issue #188: every interactive element has a hit area of at least 44x44 CSS px
 * and the language switch meets WCAG AA contrast in every theme.
 *
 * jsdom has no layout engine, so nothing here measures painted pixels. The
 * hit-area guarantee lives in two rules in src/index.css (an invisible ::after
 * with min 44x44, and a 44px min-height for text fields). This test (1) parses
 * those rules, so weakening them fails, (2) renders each main screen in each
 * theme and computes every interactive element's effective hit size from the
 * rules that actually match it plus its inline size, and fails under 44, and
 * (3) proves the measurement itself can fail with a negative control.
 */

const MIN = 44
// vitest empties `?raw` CSS imports, so read the file; vitest runs from the project root.
const css = readFileSync('src/index.css', 'utf8')

function px(value) {
  const m = /^(\d+(?:\.\d+)?)px$/.exec(value ?? '')
  return m ? Number(m[1]) : null
}

function ruleFor(pattern) {
  const m = pattern.exec(css)
  if (!m) throw new Error(`Touch-target rule not found in index.css: ${pattern}`)
  return { selector: m[1], body: m[2] }
}

const HIT_RULE = ruleFor(/:where\((.+)\)::after\s*\{([^}]*)\}/)
const FIELD_RULE = ruleFor(/:where\((input:not.+?)\)\s*\{([^}]*)\}/)

function declared(body, prop) {
  const m = new RegExp(`(?:^|[;\\s])${prop}:\\s*([^;]+);`).exec(body)
  return m ? px(m[1].trim()) : null
}

describe('touch-target rules in index.css', () => {
  it('declare a 44px minimum in both axes on the hit-area pseudo-element', () => {
    expect(declared(HIT_RULE.body, 'min-width')).toBeGreaterThanOrEqual(MIN)
    expect(declared(HIT_RULE.body, 'min-height')).toBeGreaterThanOrEqual(MIN)
    expect(HIT_RULE.body).toMatch(/position:\s*absolute/)
    expect(HIT_RULE.body).toMatch(/content:\s*''/)
  })

  it('declare a 44px minimum height for text fields and selects', () => {
    expect(declared(FIELD_RULE.body, 'min-height')).toBeGreaterThanOrEqual(MIN)
  })
})

const INTERACTIVE = [
  'button',
  'a[href]',
  'summary',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]', '[role="tab"]', '[role="checkbox"]', '[role="switch"]',
  '[role="link"]', '[role="radio"]', '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isHidden(el) {
  return el.hidden || el.closest('[hidden], [aria-hidden="true"]') !== null || el.style.display === 'none'
}

/**
 * Effective hit size of an element in CSS px. A pseudo-element extension only
 * counts when the element does not clip it (overflow) or lose its positioning.
 * Returns null for a dimension that is unconstrained (fluid text fields).
 */
function hitSize(el) {
  // A checkbox or radio is activated through its wrapping label.
  const target = el.matches('input[type="checkbox"], input[type="radio"]') ? (el.closest('label') ?? el) : el
  let width = px(target.style.width) ?? px(target.style.minWidth)
  let height = px(target.style.height) ?? px(target.style.minHeight)
  const clips = target.style.overflow === 'hidden' || target.style.position === 'static'
  if (!clips && target.matches(HIT_RULE.selector)) {
    width = Math.max(width ?? 0, declared(HIT_RULE.body, 'min-width'))
    height = Math.max(height ?? 0, declared(HIT_RULE.body, 'min-height'))
  }
  if (target.matches(FIELD_RULE.selector)) {
    height = Math.max(height ?? 0, declared(FIELD_RULE.body, 'min-height'))
    width = width ?? Infinity // fluid, sized by its container
  }
  return { width: width ?? 0, height: height ?? 0 }
}

/** Interactive elements under `root` whose effective hit area is under 44px. */
function undersized(root = document.body) {
  return [...root.querySelectorAll(INTERACTIVE)]
    .filter((el) => !isHidden(el))
    .map((el) => ({ el, ...hitSize(el) }))
    .filter(({ width, height }) => width < MIN || height < MIN)
    .map(({ el, width, height }) => `${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 24)}] ${width}x${height}`)
}

describe('hit-size measurement', () => {
  it('fails under 44px: a bare tabindex div and an unlabelled checkbox are flagged', () => {
    const { container } = render(
      <div>
        <div tabIndex={0} style={{ width: 18, height: 18 }} />
        <input type="checkbox" />
        <button type="button" style={{ width: 18, height: 18 }} />
      </div>,
    )
    const found = undersized(container)
    expect(found).toHaveLength(2)
    expect(found[0]).toMatch(/^div/)
    expect(found[1]).toMatch(/^input/)
  })

  it('does not trust an extension that overflow would clip', () => {
    const { container } = render(<button type="button" style={{ width: 18, height: 18, overflow: 'hidden' }} />)
    expect(undersized(container)).toHaveLength(1)
  })
})

const colonies = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }]

function seed(theme, locale, onboardingDone = true) {
  localStorage.setItem('apiario-locale', locale)
  localStorage.setItem('apiario-theme', theme)
  localStorage.setItem('apiario-profile', JSON.stringify({
    schemaVersion: 3, onboardingDone, climateZone: 'central', experience: 1, hiveCount: 2, colonies,
  }))
  localStorage.setItem('apiario-inspections', JSON.stringify([
    { id: 'i1', colonyId: 'a', date: '2026-04-10', queenStatus: 'seen', varroa: 0, broodPattern: 4, notes: '', createdAt: '2026-04-10T10:00:00.000Z' },
  ]))
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 3, 15, 12))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete document.startViewTransition
  localStorage.clear()
})

const nameOf = (b) => b.getAttribute('aria-label') ?? b.textContent
async function clickNav(re) {
  const nav = await screen.findByRole('navigation')
  fireEvent.click(within(nav).getByRole('button', { name: re }))
}
// Content buttons only: the bottom nav has its own "My Hive" and "Inspect" entries.
async function clickText(re) {
  const hit = await waitFor(() => {
    const buttons = screen.getAllByRole('button')
    const found = buttons.find((b) => !b.closest('nav') && re.test(nameOf(b).trim()))
    if (!found) throw new Error(`No button matching ${re} among: ${buttons.map((b) => nameOf(b).trim()).join(' | ')}`)
    return found
  })
  fireEvent.click(hit)
}

const SCREENS = [
  ['season', async () => {}],
  ['diagnose', () => clickNav(/Diagnose/)],
  ['diagnose question', async () => { await clickNav(/Diagnose/); await clickText(/Very few bees/) }],
  ['inspect', () => clickNav(/Inspect/)],
  ['learn', () => clickNav(/Learn/)],
  ['my hive: colonies', () => clickNav(/My Hive/)],
  ['my hive: add colony form', async () => { await clickNav(/My Hive/); await clickText(/Add a colony/) }],
  ['inspection form', async () => { await clickNav(/Inspect/); await clickText(/\+ Inspect/) }],
  ['my hive: inspections', async () => { await clickNav(/My Hive/); await clickText(/^Inspections$/) }],
  ['my hive: log', async () => { await clickNav(/My Hive/); await clickText(/^Log$/) }],
  ['my hive: profile', async () => { await clickNav(/My Hive/); await clickText(/^Profile$/) }],
]

describe.each(['a', 'b', 'c'])('every interactive element is at least 44px, theme %s', (theme) => {
  it.each(['en', 'de'])('onboarding (%s)', async (locale) => {
    seed(theme, locale, false)
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(undersized()).toEqual([])
  })

  it.each(SCREENS)('%s', async (name, go) => {
    seed(theme, 'en')
    render(<App />)
    await screen.findByRole('navigation')
    await go()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
    expect(undersized()).toEqual([])
  })
})

/* ── Language switch contrast, asserted against the theme tokens ── */

function channel(v) {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function themeTokens(theme) {
  const blocks = [...css.matchAll(new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`, 'g'))]
    .map((m) => m[1])
    .filter((body) => body.includes('--theme-lang-bg'))
  if (blocks.length !== 1) throw new Error(`Expected one --theme-lang-* block for theme ${theme}, found ${blocks.length}`)
  const read = (name) => new RegExp(`--theme-lang-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(blocks[0])?.[1]
  return { bg: read('bg'), fg: read('fg'), activeBg: read('active-bg'), activeFg: read('active-fg') }
}

describe('language switch contrast', () => {
  it('contrast helper matches known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrast('#ffffff', '#e8890c')).toBeLessThan(4.5) // the old active state
  })

  it.each(['a', 'b', 'c'])('theme %s: inactive and active text are at least 4.5:1', (theme) => {
    const t = themeTokens(theme)
    for (const value of Object.values(t)) expect(value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(contrast(t.fg, t.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.activeFg, t.activeBg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['a', 'b', 'c'])('theme %s: the rendered buttons read those tokens, not fixed colors', (theme) => {
    localStorage.setItem('apiario-theme', theme)
    localStorage.setItem('apiario-locale', 'en')
    render(<ThemeProvider><LanguageProvider><LanguageToggle /></LanguageProvider></ThemeProvider>)
    const [de, en] = screen.getAllByRole('button')
    expect(en.style.color).toBe('var(--theme-lang-active-fg)')
    expect(en.style.background).toContain('var(--theme-lang-active-bg)')
    expect(de.style.color).toBe('var(--theme-lang-fg)')
    expect(de.style.background).toContain('var(--theme-lang-bg)')
    // Side-by-side buttons must be 44px wide for real, not through overlapping extensions.
    expect(de.className).toContain('min-w-11')
    expect(en.className).toContain('min-w-11')
  })
})
