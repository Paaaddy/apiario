import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from '../context/ThemeContext'
import { LanguageProvider } from '../context/LanguageContext'
import InspectionTab from './InspectionTab'
import ColonyDetail from './ColonyDetail'
import ColoniesSection from './ColoniesSection'

const colonies = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }]
const inspections = [{ id: 'i', colonyId: 'a', date: '2026-05-01', queenStatus: 'seen' }]
function wrap(ui) { return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>) }
beforeEach(() => localStorage.setItem('apiario-locale', 'en'))
afterEach(() => localStorage.clear())

it.each([
  ['list', { ok: false, messageKey: 'insp_colony_full' }],
  ['detail', { ok: false, messageKey: 'insp_colony_full' }],
  ['list', { ok: false, error: 'validation', messageKey: 'record_invalid' }],
  ['detail', { ok: false, error: 'validation', messageKey: 'record_invalid' }],
])('keeps a rejected edit draft through the %s screen', async (kind, outcome) => {
  const update = vi.fn(() => outcome)
  wrap(kind === 'list'
    ? <InspectionTab colonies={colonies} inspections={inspections} onUpdate={update} />
    : <ColonyDetail colony={colonies[0]} colonies={colonies} inspections={inspections} onUpdateInspection={update} />)
  fireEvent.click(screen.getByLabelText(/2026-05-01/))
  fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }))
  fireEvent.change(screen.getByLabelText('Colony'), { target: { value: 'b' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent(outcome.error ? 'Some fields are invalid' : 'This colony already has 500 inspections')
  expect(screen.getByRole('dialog', { name: 'Edit inspection' })).toBeInTheDocument()
  expect(screen.getByLabelText('Colony')).toHaveValue('b')
  expect(update).toHaveBeenCalledWith('i', expect.objectContaining({ colonyId: 'b' }))
})

it('keeps an invalid quick-add Inspection draft through the Colony screen', async () => {
  wrap(<ColoniesSection colonies={colonies} onAddInspection={() => ({ ok: false, error: 'validation', messageKey: 'record_invalid' })} />)
  fireEvent.click(screen.getAllByRole('button', { name: '+ Inspect' })[0])
  fireEvent.click(screen.getByRole('button', { name: /👑 Seen/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Some fields are invalid')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
