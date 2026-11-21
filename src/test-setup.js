import '@testing-library/jest-dom'

// The diagnosis walk lives in sessionStorage; keep tests from leaking it.
afterEach(() => {
  try { sessionStorage.clear() } catch { /* storage blocked by the test */ }
})
