import { renderHook, act } from '@testing-library/react'
import { useTaskLog } from './useTaskLog'

const task = {
  id: 'sp-01',
  name: { de: 'Frühjahrskontrolle', en: 'Spring inspection' },
  urgency: 'important',
}

beforeEach(() => {
  localStorage.clear()
})

describe('useTaskLog', () => {
  it('starts with empty log', () => {
    const { result } = renderHook(() => useTaskLog())
    expect(result.current.log).toHaveLength(0)
    expect(result.current.completedTaskIds.size).toBe(0)
  })

  it('toggleTask adds a task entry', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.toggleTask(task))
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].type).toBe('task')
    expect(result.current.log[0].taskId).toBe('sp-01')
    expect(result.current.completedTaskIds.has('sp-01')).toBe(true)
  })

  it('toggleTask removes an existing entry', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.toggleTask(task))
    act(() => result.current.toggleTask(task))
    expect(result.current.log).toHaveLength(0)
    expect(result.current.completedTaskIds.has('sp-01')).toBe(false)
  })

  it('addCustomEntry adds a custom entry', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Fed sugar syrup', date: '2026-04-13' }))
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].type).toBe('custom')
    expect(result.current.log[0].text).toBe('Fed sugar syrup')
    expect(result.current.log[0].date).toBe('2026-04-13')
  })

  it('deleteEntry removes an entry by id', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Test note', date: '2026-04-13' }))
    const id = result.current.log[0].id
    act(() => result.current.deleteEntry(id))
    expect(result.current.log).toHaveLength(0)
  })

  it('persists entries to localStorage', () => {
    const { result } = renderHook(() => useTaskLog())
    act(() => result.current.addCustomEntry({ text: 'Test', date: '2026-04-13' }))
    const stored = JSON.parse(localStorage.getItem('apiario-log'))
    expect(stored).toHaveLength(1)
    expect(stored[0].text).toBe('Test')
  })

  it('reads existing log from localStorage on mount', () => {
    const existing = [{ id: 'custom-1', type: 'custom', text: 'Existing', date: '2026-04-12' }]
    localStorage.setItem('apiario-log', JSON.stringify(existing))
    const { result } = renderHook(() => useTaskLog())
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].text).toBe('Existing')
  })

  it('completedTaskIds reflects current completed tasks', () => {
    const { result } = renderHook(() => useTaskLog())
    const task2 = { id: 'sp-02', name: { de: 'Vorräte', en: 'Stores' }, urgency: 'important' }
    act(() => result.current.toggleTask(task))
    act(() => result.current.toggleTask(task2))
    expect(result.current.completedTaskIds.has('sp-01')).toBe(true)
    expect(result.current.completedTaskIds.has('sp-02')).toBe(true)
    act(() => result.current.toggleTask(task))
    expect(result.current.completedTaskIds.has('sp-01')).toBe(false)
    expect(result.current.completedTaskIds.has('sp-02')).toBe(true)
  })
})
