import { vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { registerPwaAutoUpdate } from './registerAutoUpdate'
import { useProfile } from '../hooks/useProfile'

const { registerSW } = vi.hoisted(() => ({ registerSW: vi.fn(() => vi.fn()) }))
vi.mock('virtual:pwa-register', () => ({ registerSW }))
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); vi.useFakeTimers() })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear() })

it('intercepts the actual auto-update reload callback', () => {
  const reload = vi.fn()
  const dispose = registerPwaAutoUpdate(reload)
  const options = registerSW.mock.calls[0][0]
  expect(options.onNeedReload).toEqual(expect.any(Function))
  options.onNeedReload()
  expect(reload).toHaveBeenCalledOnce()
  dispose()
})

it('polls the actual registration and stops polling on disposal', async () => {
  const dispose = registerPwaAutoUpdate(vi.fn())
  const options = registerSW.mock.calls[0][0]
  const registration = { update: vi.fn().mockResolvedValue(undefined) }
  options.onRegisteredSW('/sw.js', registration)
  await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
  expect(registration.update).toHaveBeenCalledOnce()
  dispose()
  await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
  expect(registration.update).toHaveBeenCalledOnce()
})

it('does not reload over unsaved data, even before React renders the storage notice', () => {
  const reload = vi.fn()
  const dispose = registerPwaAutoUpdate(reload)
  const { result } = renderHook(() => useProfile())
  const options = registerSW.mock.calls[0][0]
  expect(options.onNeedReload).toEqual(expect.any(Function))
  const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full') })
  act(() => {
    result.current.updateProfile({ experience: 1 })
    options.onNeedReload()
  })
  expect(reload).not.toHaveBeenCalled()
  writes.mockRestore()
  act(() => result.current.retrySave())
  expect(reload).not.toHaveBeenCalled()
  dispose()
})
