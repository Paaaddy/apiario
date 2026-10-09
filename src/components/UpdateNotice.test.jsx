import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import { applyPendingUpdate, cancelPendingReload, getReloadStatus, protectReload, requestAppReload } from '../pwa/reloadSafety'
import UpdateNotice from './UpdateNotice'
import InspectionForm from './InspectionForm'
import ColoniesSection from '../screens/ColoniesSection'
import LogSection from '../screens/LogSection'

const colonies = [{ id: 'a', name: 'Apple' }]
const reload = vi.fn()
function wrap(ui) { return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>) }
beforeEach(() => { localStorage.setItem('apiario-locale', 'en'); reload.mockClear() })
afterEach(() => { cancelPendingReload(reload); localStorage.clear() })

it.each(['a', 'b', 'c'])('protects an Inspection draft and offers explicit update after discard in theme %s', (theme) => {
  localStorage.setItem('apiario-theme', theme)
  const form = wrap(<InspectionForm colonies={colonies} onSave={vi.fn()} onClose={vi.fn()} />)
  wrap(<UpdateNotice />)
  fireEvent.click(screen.getByRole('button', { name: /👑 Seen/ }))
  act(() => requestAppReload(reload))
  expect(screen.getByRole('status')).toHaveTextContent('Update waiting')
  expect(screen.queryByRole('button', { name: 'Apply update' })).not.toBeInTheDocument()
  form.unmount()
  expect(screen.getByRole('status')).toHaveTextContent('Update ready')
  expect(reload).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Apply update' }))
  expect(reload).toHaveBeenCalledOnce()
})

it('does not leave a parent draft blocker behind when a nested Inspection closes', () => {
  const form = wrap(<ColoniesSection colonies={colonies} onAddInspection={vi.fn()} onSelectColony={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: '+ Inspect' }))
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-02' } })
  act(() => requestAppReload(reload))
  expect(getReloadStatus().blocked).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(getReloadStatus().blocked).toBe(false)
  form.unmount()
})

it('saving one Colony draft does not unprotect another draft', () => {
  wrap(<ColoniesSection colonies={colonies} onAdd={vi.fn()} onUpdate={vi.fn()} onSelectColony={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /Add a colony/ }))
  fireEvent.change(screen.getByRole('textbox', { name: /Colony name/ }), { target: { value: 'Birch' } })
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  act(() => requestAppReload(reload))
  expect(getReloadStatus().blocked).toBe(true)
  fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0])
  expect(getReloadStatus().blocked).toBe(true)
})

it('clears Log draft protection on explicit cancellation', () => {
  wrap(<LogSection onAddEntry={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /Custom entry/ }))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unsaved note' } })
  expect(getReloadStatus().blocked).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(getReloadStatus().blocked).toBe(false)
})

it('rechecks safety when applying a pending update and translates both states', () => {
  const token = {}
  localStorage.setItem('apiario-locale', 'de')
  act(() => { protectReload(token, true); requestAppReload(reload) })
  wrap(<UpdateNotice />)
  expect(screen.getByRole('status')).toHaveTextContent('Update wartet')
  expect(applyPendingUpdate()).toBe(false)
  act(() => protectReload(token, false))
  expect(screen.getByRole('button', { name: 'Update laden' })).toBeInTheDocument()
  act(() => protectReload(token, true))
  expect(applyPendingUpdate()).toBe(false)
  act(() => protectReload(token, false))
})
