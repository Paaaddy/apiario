import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import ColoniesSection from './ColoniesSection'

beforeEach(() => {
  localStorage.setItem('apiario-locale', 'en')
})
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

const sampleColonies = [
  { id: 'col-1', name: 'Apple tree', createdAt: '2026-03-01', notes: 'Next to the south wall' },
  { id: 'col-2', name: 'Garden', createdAt: '2026-03-05', notes: '' },
]

describe('ColoniesSection', () => {
  it('renders the empty state when there are no colonies', () => {
    wrap(<ColoniesSection colonies={[]} />)
    expect(screen.getByText(/no colonies added yet/i)).toBeInTheDocument()
  })

  it('lists every colony with its name, notes and created date', () => {
    wrap(<ColoniesSection colonies={sampleColonies} />)
    expect(screen.getByText(/🐝 Apple tree/)).toBeInTheDocument()
    expect(screen.getByText(/Next to the south wall/)).toBeInTheDocument()
    expect(screen.getByText(/🐝 Garden/)).toBeInTheDocument()
    expect(screen.getAllByText(/Added on/)).toHaveLength(2)
  })

  it('opens an add form when "+ Add a colony" is clicked', async () => {
    const user = userEvent.setup()
    wrap(<ColoniesSection colonies={[]} onAdd={() => {}} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    expect(
      screen.getByPlaceholderText(/colony name/i)
    ).toBeInTheDocument()
  })

  it('calls onAdd with the trimmed name and notes', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ColoniesSection colonies={[]} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.type(screen.getByPlaceholderText(/colony name/i), '  Cherry  ')
    await user.type(screen.getByPlaceholderText(/notes/i), 'Young colony')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onAdd).toHaveBeenCalledWith('Cherry', 'Young colony')
  })

  it('does not submit when the name is empty', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ColoniesSection colonies={[]} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('cancel closes the add form without calling onAdd', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ColoniesSection colonies={[]} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.type(screen.getByPlaceholderText(/colony name/i), 'Discarded')
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText(/colony name/i)).not.toBeInTheDocument()
  })

  it('enters edit mode and calls onUpdate with the new values', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ColoniesSection colonies={sampleColonies} onUpdate={onUpdate} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])
    const nameField = screen.getByDisplayValue('Apple tree')
    await user.clear(nameField)
    await user.type(nameField, 'Apple tree ⭐')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onUpdate).toHaveBeenCalledWith('col-1', {
      name: 'Apple tree ⭐',
      notes: 'Next to the south wall',
    })
  })

  it('calls onRemove after confirming the delete prompt', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    wrap(<ColoniesSection colonies={sampleColonies} onRemove={onRemove} />)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith('col-1')
  })

  it('does not call onRemove when the delete prompt is declined', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    vi.spyOn(window, 'confirm').mockImplementation(() => false)
    wrap(<ColoniesSection colonies={sampleColonies} onRemove={onRemove} />)
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
    expect(onRemove).not.toHaveBeenCalled()
  })
})
