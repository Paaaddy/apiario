import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shareOrCopy } from './share'

const originalShare = globalThis.navigator.share
const originalClipboard = globalThis.navigator.clipboard

afterEach(() => {
  globalThis.navigator.share = originalShare
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: originalClipboard,
    writable: true,
    configurable: true,
  })
})

describe('shareOrCopy', () => {
  it('calls navigator.share when supported', async () => {
    const share = vi.fn(() => Promise.resolve())
    globalThis.navigator.share = share
    const result = await shareOrCopy({ title: 'T', text: 'Body', url: 'https://x' })
    expect(share).toHaveBeenCalledWith({ title: 'T', text: 'Body', url: 'https://x' })
    expect(result).toEqual({ status: 'shared' })
  })

  it('reports cancelled when the user aborts the share sheet', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' })
    globalThis.navigator.share = vi.fn(() => Promise.reject(abort))
    const result = await shareOrCopy({ title: 'T' })
    expect(result).toEqual({ status: 'cancelled' })
  })

  it('falls back to clipboard when navigator.share is missing', async () => {
    delete globalThis.navigator.share
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })
    const result = await shareOrCopy({ title: 'Header', text: 'Body', url: 'https://x' })
    expect(writeText).toHaveBeenCalledWith('Header\n\nBody\n\nhttps://x')
    expect(result).toEqual({ status: 'copied' })
  })

  it('falls back to clipboard when navigator.share throws a non-abort error', async () => {
    globalThis.navigator.share = vi.fn(() => Promise.reject(new Error('permission denied')))
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })
    const result = await shareOrCopy({ text: 'Just text' })
    expect(writeText).toHaveBeenCalledWith('Just text')
    expect(result).toEqual({ status: 'copied' })
  })

  it('reports unsupported when neither API is available', async () => {
    delete globalThis.navigator.share
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    const result = await shareOrCopy({ text: 'hi' })
    expect(result.status).toBe('unsupported')
  })

  it('strips null/undefined fields before passing to navigator.share', async () => {
    const share = vi.fn(() => Promise.resolve())
    globalThis.navigator.share = share
    await shareOrCopy({ title: 'T', text: null, url: undefined })
    expect(share).toHaveBeenCalledWith({ title: 'T' })
  })
})
