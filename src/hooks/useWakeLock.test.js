import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

const originalWakeLock = globalThis.navigator.wakeLock

function mockWakeLock() {
  const sentinel = {
    release: vi.fn(() => Promise.resolve()),
    addEventListener: vi.fn(),
  }
  const request = vi.fn(() => Promise.resolve(sentinel))
  Object.defineProperty(globalThis.navigator, 'wakeLock', {
    value: { request },
    writable: true,
    configurable: true,
  })
  return { sentinel, request }
}

afterEach(() => {
  Object.defineProperty(globalThis.navigator, 'wakeLock', {
    value: originalWakeLock,
    writable: true,
    configurable: true,
  })
})

describe('useWakeLock', () => {
  it('isSupported is false when the API is missing', () => {
    Object.defineProperty(globalThis.navigator, 'wakeLock', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    const { result } = renderHook(() => useWakeLock(true))
    expect(result.current.isSupported).toBe(false)
  })

  it('acquires a screen wake lock when enabled=true', async () => {
    const { request } = mockWakeLock()
    renderHook(() => useWakeLock(true))
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith('screen')
    })
  })

  it('does not acquire a lock when enabled=false', async () => {
    const { request } = mockWakeLock()
    renderHook(() => useWakeLock(false))
    // Nothing to await — just verify no call happened.
    await new Promise((r) => setTimeout(r, 10))
    expect(request).not.toHaveBeenCalled()
  })

  it('releases the lock on unmount', async () => {
    const { sentinel } = mockWakeLock()
    const { unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => {
      expect(sentinel.addEventListener).toHaveBeenCalled()
    })
    unmount()
    await waitFor(() => {
      expect(sentinel.release).toHaveBeenCalled()
    })
  })

  it('records an error when wakeLock.request rejects', async () => {
    const sentinel = { release: vi.fn(), addEventListener: vi.fn() }
    const request = vi.fn(() => Promise.reject(new Error('NotAllowed')))
    Object.defineProperty(globalThis.navigator, 'wakeLock', {
      value: { request },
      writable: true,
      configurable: true,
    })
    const { result } = renderHook(() => useWakeLock(true))
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error.message).toBe('NotAllowed')
    })
    expect(sentinel.release).not.toHaveBeenCalled()
  })
})
