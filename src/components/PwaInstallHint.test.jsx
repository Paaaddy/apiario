import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import PwaInstallHint from './PwaInstallHint'
import BeeFab from './BeeFab'
import { PWA_HINT_DISMISSED_KEY } from '../hooks/usePwaHintDismissal'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const TITLE = /faster access like a native app/i
const DISMISS = { name: /dismiss install hint/i }

function hint(props = {}) {
  return (
    <LanguageProvider>
      <PwaInstallHint isInstalled={false} installSupported onInstall={() => {}} compact dismissible floating {...props} />
    </LanguageProvider>
  )
}

describe('PwaInstallHint visibility', () => {
  it('appears when installable and not dismissed', () => {
    render(hint())
    expect(screen.getByText(TITLE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /install now/i })).toBeInTheDocument()
  })

  it('stays hidden once the app is installed', () => {
    render(hint({ isInstalled: true }))
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
  })
})

describe('PwaInstallHint dismissal', () => {
  it('stays hidden after dismissal and remount', async () => {
    const user = userEvent.setup()
    const first = render(hint())
    await user.click(screen.getByRole('button', DISMISS))
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
    expect(localStorage.getItem(PWA_HINT_DISMISSED_KEY)).toBe('true')
    first.unmount()

    render(hint())
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
  })

  it.each(['{not json', '"yes"', 'false'])('shows the hint when the stored value is %s', (raw) => {
    localStorage.setItem(PWA_HINT_DISMISSED_KEY, raw)
    render(hint())
    expect(screen.getByText(TITLE)).toBeInTheDocument()
  })

  it('still renders and dismisses for the session when storage reads throw', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === PWA_HINT_DISMISSED_KEY) throw new Error('storage unavailable')
      return 'en'
    })
    const user = userEvent.setup()
    render(hint())
    expect(screen.getByText(TITLE)).toBeInTheDocument()
    await user.click(screen.getByRole('button', DISMISS))
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
  })

  it('dismisses for the session when storage writes throw', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const user = userEvent.setup()
    render(hint())
    await user.click(screen.getByRole('button', DISMISS))
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
  })
})

// jsdom does no layout, so resolve each fixed box from its Tailwind classes at
// a given viewport. Unknown classes throw rather than silently pass. The hint's
// height depends on its content, so it is treated as extending upward without
// limit from its bottom anchor, which is the conservative reading.
const SPACING = 4
const MAX_W = { 'max-w-md': 448 }

function fixedBox(element, viewport) {
  const tokens = element.className.split(/\s+/)
  const spacing = (prefix) => {
    const token = tokens.find((t) => new RegExp(`^${prefix}-\\d+$`).test(t))
    return token === undefined ? undefined : Number(token.split('-')[1]) * SPACING
  }
  if (!tokens.includes('fixed')) throw new Error(`not fixed: ${element.className}`)
  const bottom = spacing('bottom')
  if (bottom === undefined) throw new Error(`no bottom anchor: ${element.className}`)
  const left = spacing('left')
  const right = spacing('right')
  let width = spacing('w')
  const maxWidth = tokens.map((t) => MAX_W[t]).find((v) => v !== undefined) ?? Infinity
  let x
  if (width === undefined) {
    if (left === undefined || right === undefined) throw new Error(`no width: ${element.className}`)
    width = Math.min(viewport.width - left - right, maxWidth)
    x = left + (viewport.width - left - right - width) / 2
  } else if (right !== undefined) {
    x = viewport.width - right - width
  } else if (left !== undefined) {
    x = left
  } else {
    throw new Error(`no horizontal anchor: ${element.className}`)
  }
  const height = spacing('h')
  return {
    left: x,
    right: x + width,
    bottomEdge: viewport.height - bottom,
    topEdge: height === undefined ? -Infinity : viewport.height - bottom - height,
  }
}

function intersects(a, b) {
  return a.left < b.right && b.left < a.right && a.topEdge < b.bottomEdge && b.topEdge < a.bottomEdge
}

describe('PwaInstallHint placement against the voice button', () => {
  function renderBoth(props) {
    render(
      <LanguageProvider>
        <PwaInstallHint isInstalled={false} installSupported onInstall={() => {}} compact dismissible floating {...props} />
        <BeeFab onActivate={() => {}} isActive={false} />
      </LanguageProvider>
    )
    return {
      hintBox: screen.getByText(TITLE).closest('section'),
      fabBox: screen.getByRole('button', { name: /bee hands-free mode/i }),
    }
  }

  it.each([320, 375, 768])('does not intersect the voice button hit area at %ipx', (width) => {
    const { hintBox, fabBox } = renderBoth()
    const viewport = { width, height: 640 }
    expect(intersects(fixedBox(hintBox, viewport), fixedBox(fabBox, viewport))).toBe(false)
  })

  // At 768px the hint is capped at max-w-md and centred, so it never reached
  // the voice button there; the overlap was on phone widths.
  it('geometry check detects the previous overlapping placement on phones', () => {
    const { hintBox, fabBox } = renderBoth()
    hintBox.className = hintBox.className.replace('bottom-36', 'bottom-24')
    for (const width of [320, 375]) {
      const viewport = { width, height: 640 }
      expect(intersects(fixedBox(hintBox, viewport), fixedBox(fabBox, viewport))).toBe(true)
    }
  })
})
