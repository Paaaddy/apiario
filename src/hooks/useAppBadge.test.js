import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAppBadge } from './useAppBadge'

afterEach(() => {
  delete globalThis.navigator.setAppBadge
  delete globalThis.navigator.clearAppBadge
})

describe('useAppBadge', () => {
  it('calls setAppBadge with the count when > 0', async () => {
    globalThis.navigator.setAppBadge = vi.fn(() => Promise.resolve())
    globalThis.navigator.clearAppBadge = vi.fn(() => Promise.resolve())
    renderHook(() => useAppBadge(3))
    await waitFor(() => {
      expect(globalThis.navigator.setAppBadge).toHaveBeenCalledWith(3)
    })
  })

  it('calls clearAppBadge when the count is 0', async () => {
    globalThis.navigator.setAppBadge = vi.fn(() => Promise.resolve())
    globalThis.navigator.clearAppBadge = vi.fn(() => Promise.resolve())
    renderHook(() => useAppBadge(0))
    await waitFor(() => {
      expect(globalThis.navigator.clearAppBadge).toHaveBeenCalled()
    })
    expect(globalThis.navigator.setAppBadge).not.toHaveBeenCalled()
  })

  it('no-ops silently when the API is unavailable', () => {
    delete globalThis.navigator.setAppBadge
    expect(() => renderHook(() => useAppBadge(5))).not.toThrow()
  })

  it('clears the badge on unmount', async () => {
    globalThis.navigator.setAppBadge = vi.fn(() => Promise.resolve())
    globalThis.navigator.clearAppBadge = vi.fn(() => Promise.resolve())
    const { unmount } = renderHook(() => useAppBadge(7))
    await waitFor(() => {
      expect(globalThis.navigator.setAppBadge).toHaveBeenCalled()
    })
    unmount()
    await waitFor(() => {
      expect(globalThis.navigator.clearAppBadge).toHaveBeenCalled()
    })
  })

  it('swallows errors from the API (e.g. NotAllowedError)', async () => {
    globalThis.navigator.setAppBadge = vi.fn(() => Promise.reject(new Error('NotAllowed')))
    globalThis.navigator.clearAppBadge = vi.fn(() => Promise.resolve())
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow()
  })
})
