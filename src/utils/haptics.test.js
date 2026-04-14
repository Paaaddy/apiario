import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { haptics } from './haptics'

const originalVibrate = globalThis.navigator.vibrate

beforeEach(() => {
  globalThis.navigator.vibrate = vi.fn(() => true)
})

afterEach(() => {
  globalThis.navigator.vibrate = originalVibrate
})

describe('haptics', () => {
  it('tap() calls navigator.vibrate with a perceptible short duration', () => {
    haptics.tap()
    // Must be >= 20ms; most Android vibration motors silently drop pulses
    // shorter than that because the motor can't ramp up in time.
    expect(globalThis.navigator.vibrate).toHaveBeenCalledWith(25)
  })

  it('success() calls vibrate with a pattern', () => {
    haptics.success()
    expect(globalThis.navigator.vibrate).toHaveBeenCalledWith([30, 50, 30])
  })

  it('warn() uses a double-buzz pattern', () => {
    haptics.warn()
    expect(globalThis.navigator.vibrate).toHaveBeenCalledWith([20, 40, 20, 40, 20])
  })

  it('stop() cancels any ongoing vibration', () => {
    haptics.stop()
    expect(globalThis.navigator.vibrate).toHaveBeenCalledWith(0)
  })

  it('silently no-ops when navigator.vibrate is missing', () => {
    delete globalThis.navigator.vibrate
    // Should not throw
    expect(() => haptics.tap()).not.toThrow()
    expect(() => haptics.success()).not.toThrow()
  })

  it('silently no-ops when navigator.vibrate throws', () => {
    globalThis.navigator.vibrate = vi.fn(() => {
      throw new Error('blocked')
    })
    expect(() => haptics.tap()).not.toThrow()
  })
})
