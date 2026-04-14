import { describe, it, expect, vi, afterEach } from 'vitest'
import { runWithViewTransition } from './viewTransitions'

afterEach(() => {
  delete document.startViewTransition
})

describe('runWithViewTransition', () => {
  it('runs the update synchronously when the API is missing', () => {
    delete document.startViewTransition
    const update = vi.fn()
    runWithViewTransition(update)
    expect(update).toHaveBeenCalled()
  })

  it('delegates to document.startViewTransition when available', () => {
    const update = vi.fn()
    const startViewTransition = vi.fn((fn) => {
      fn()
      return { finished: Promise.resolve() }
    })
    document.startViewTransition = startViewTransition
    runWithViewTransition(update)
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
  })
})
