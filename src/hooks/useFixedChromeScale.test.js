import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFixedChromeScale } from './useFixedChromeScale'

const ORIGINAL_OUTER = window.outerWidth
const ORIGINAL_INNER = window.innerWidth

function makeViewport(scale = 1, extras = {}) {
  const listeners = new Map()
  return {
    scale,
    offsetTop: extras.offsetTop ?? 0,
    offsetLeft: extras.offsetLeft ?? 0,
    width: extras.width ?? 390,
    height: extras.height ?? 800,
    addEventListener: vi.fn((type, fn) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(fn)
    }),
    removeEventListener: vi.fn((type, fn) => {
      listeners.get(type)?.delete(fn)
    }),
    fire(type) {
      listeners.get(type)?.forEach((fn) => fn({ type }))
    },
  }
}

function setBrowserDims(outer, inner) {
  Object.defineProperty(window, 'outerWidth', { configurable: true, value: outer })
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: inner })
}

beforeEach(() => {
  document.documentElement.removeAttribute('style')
  setBrowserDims(1000, 1000)
})

afterEach(() => {
  document.documentElement.removeAttribute('style')
  setBrowserDims(ORIGINAL_OUTER, ORIGINAL_INNER)
  // Remove the visualViewport stub so other tests aren't affected.
  delete window.visualViewport
})

describe('useFixedChromeScale', () => {
  it('writes --app-zoom = 1 when there is no zoom', () => {
    window.visualViewport = makeViewport(1)
    renderHook(() => useFixedChromeScale())
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1')
  })

  it('reflects pinch zoom via visualViewport.scale', () => {
    const vv = makeViewport(2)
    window.visualViewport = vv
    renderHook(() => useFixedChromeScale())
    // 2 (pinch) * 1 (browser, since outer === inner) = 2
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('2')
  })

  it('reflects desktop browser zoom via outerWidth/innerWidth', () => {
    window.visualViewport = makeViewport(1)
    setBrowserDims(1500, 1000) // browser = 1.5x
    renderHook(() => useFixedChromeScale())
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1.5')
  })

  it('combines pinch and browser zoom multiplicatively', () => {
    window.visualViewport = makeViewport(2)
    setBrowserDims(1500, 1000)
    renderHook(() => useFixedChromeScale())
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('3')
  })

  it('updates when visualViewport fires resize', () => {
    const vv = makeViewport(1)
    window.visualViewport = vv
    renderHook(() => useFixedChromeScale())
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1')

    act(() => {
      vv.scale = 1.75
      vv.fire('resize')
    })
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1.75')
  })

  it('exposes visual viewport offset and size as CSS vars', () => {
    window.visualViewport = makeViewport(1, { offsetTop: 12, offsetLeft: 4, width: 320, height: 600 })
    renderHook(() => useFixedChromeScale())
    const root = document.documentElement.style
    expect(root.getPropertyValue('--vv-offset-top')).toBe('12px')
    expect(root.getPropertyValue('--vv-offset-left')).toBe('4px')
    expect(root.getPropertyValue('--vv-width')).toBe('320px')
    expect(root.getPropertyValue('--vv-height')).toBe('600px')
  })

  it('falls back to 1 when visualViewport is missing', () => {
    delete window.visualViewport
    renderHook(() => useFixedChromeScale())
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1')
  })

  it('removes its listeners on unmount', () => {
    const vv = makeViewport(1)
    window.visualViewport = vv
    const { unmount } = renderHook(() => useFixedChromeScale())
    unmount()
    // resize + scroll listeners both removed.
    expect(vv.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(vv.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
