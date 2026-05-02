import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import InspectionForm from './InspectionForm'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

const colonies = [{ id: 'c1', name: 'Hive One' }]

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

describe('InspectionForm', () => {
  it('renders the add title', () => {
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/new inspection/i)).toBeInTheDocument()
  })

  it('renders the edit title when initial is provided', () => {
    const initial = { id: 'insp-1', colonyId: 'c1', date: '2026-05-01', queenStatus: 'seen' }
    wrap(<InspectionForm colonies={colonies} initial={initial} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/edit inspection/i)).toBeInTheDocument()
  })

  it('save button is disabled until required fields filled', () => {
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={() => {}} />)
    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('save button enabled after queen status selected', async () => {
    const user = userEvent.setup()
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: '👑 Seen' }))
    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).not.toBeDisabled()
  })

  it('calls onSave with correct data when saved', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    wrap(<InspectionForm colonies={colonies} onSave={onSave} onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: '👑 Seen' }))
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledOnce()
    const data = onSave.mock.calls[0][0]
    expect(data.colonyId).toBe('c1')
    expect(data.queenStatus).toBe('seen')
    expect(data.date).toBeTruthy()
  })

  it('calls onClose when cancel clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose after successful save', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: '👑 Seen' }))
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('toggling queen status off clears selection and disables save', async () => {
    const user = userEvent.setup()
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: '👑 Seen' }))
    await user.click(screen.getByRole('button', { name: '👑 Seen' }))
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('varroa input appears when not-tested unchecked', async () => {
    const user = userEvent.setup()
    wrap(<InspectionForm colonies={colonies} onSave={() => {}} onClose={() => {}} />)
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument()
  })

  it('populates fields from initial when editing', () => {
    const initial = { id: 'insp-1', colonyId: 'c1', date: '2026-04-15', queenStatus: 'eggs', notes: 'healthy' }
    wrap(<InspectionForm colonies={colonies} initial={initial} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByDisplayValue('2026-04-15')).toBeInTheDocument()
    expect(screen.getByDisplayValue('healthy')).toBeInTheDocument()
  })
})
