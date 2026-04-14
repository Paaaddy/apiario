import { describe, it, expect, vi, afterEach } from 'vitest'
import { requestPersistentStorage } from './persistStorage'

const originalStorage = globalThis.navigator.storage

afterEach(() => {
  Object.defineProperty(globalThis.navigator, 'storage', {
    value: originalStorage,
    writable: true,
    configurable: true,
  })
})

function mockStorage(overrides) {
  Object.defineProperty(globalThis.navigator, 'storage', {
    value: overrides,
    writable: true,
    configurable: true,
  })
}

describe('requestPersistentStorage', () => {
  it('reports unsupported when navigator.storage is missing', async () => {
    Object.defineProperty(globalThis.navigator, 'storage', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    const result = await requestPersistentStorage()
    expect(result).toEqual({ supported: false, persisted: false, estimate: null })
  })

  it('reports unsupported when persist() is missing', async () => {
    mockStorage({
      persisted: () => Promise.resolve(false),
      estimate: () => Promise.resolve({}),
    })
    const result = await requestPersistentStorage()
    expect(result.supported).toBe(false)
  })

  it('returns existing persistent state without re-requesting', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    const persisted = vi.fn(() => Promise.resolve(true))
    mockStorage({ persist, persisted })
    const result = await requestPersistentStorage()
    expect(persisted).toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
    expect(result).toMatchObject({ supported: true, persisted: true })
  })

  it('calls persist() when not already persistent and returns the grant', async () => {
    const persisted = vi.fn(() => Promise.resolve(false))
    const persist = vi.fn(() => Promise.resolve(true))
    mockStorage({ persisted, persist })
    const result = await requestPersistentStorage()
    expect(persisted).toHaveBeenCalled()
    expect(persist).toHaveBeenCalled()
    expect(result.persisted).toBe(true)
  })

  it('returns persisted=false when the browser declines', async () => {
    mockStorage({
      persisted: () => Promise.resolve(false),
      persist: () => Promise.resolve(false),
    })
    const result = await requestPersistentStorage()
    expect(result.persisted).toBe(false)
  })

  it('includes estimate() data when the API is available', async () => {
    mockStorage({
      persisted: () => Promise.resolve(true),
      persist: () => Promise.resolve(true),
      estimate: () => Promise.resolve({ usage: 1234, quota: 99999 }),
    })
    const result = await requestPersistentStorage()
    expect(result.estimate).toEqual({ usage: 1234, quota: 99999 })
  })

  it('survives persist() throwing without propagating', async () => {
    mockStorage({
      persisted: () => Promise.reject(new Error('boom')),
      persist: () => Promise.reject(new Error('boom')),
    })
    const result = await requestPersistentStorage()
    expect(result.supported).toBe(true)
    expect(result.persisted).toBe(false)
  })

  it('survives estimate() throwing without propagating', async () => {
    mockStorage({
      persisted: () => Promise.resolve(true),
      persist: () => Promise.resolve(true),
      estimate: () => Promise.reject(new Error('nope')),
    })
    const result = await requestPersistentStorage()
    expect(result.estimate).toBeNull()
  })
})
