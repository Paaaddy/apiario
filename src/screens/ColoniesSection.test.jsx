import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import ColoniesSection from './ColoniesSection'
import { buildColonyRecord, buildColonyRecords } from '../utils/inspectionHistory'
import { useProfile } from '../hooks/useProfile'
import { useInspections } from '../hooks/useInspections'
import { useColonyRemoval } from '../hooks/useColonyRemoval'

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

// ColoniesSection renders colony records, so the tests build real ones.
const sampleRecords = buildColonyRecords(sampleColonies)

describe('ColoniesSection', () => {
  it('renders the empty state when there are no colonies', () => {
    wrap(<ColoniesSection colonyRecords={[]} />)
    expect(screen.getByText(/no colonies added yet/i)).toBeInTheDocument()
  })

  it('lists every colony with its name, notes and created date', () => {
    wrap(<ColoniesSection colonyRecords={sampleRecords} />)
    expect(screen.getByText(/🐝 Apple tree/)).toBeInTheDocument()
    expect(screen.getByText(/Next to the south wall/)).toBeInTheDocument()
    expect(screen.getByText(/🐝 Garden/)).toBeInTheDocument()
    expect(screen.getAllByText(/Added on/)).toHaveLength(2)
  })

  it('opens an add form when "+ Add a colony" is clicked', async () => {
    const user = userEvent.setup()
    wrap(<ColoniesSection colonyRecords={[]} onAdd={() => {}} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    expect(
      screen.getByPlaceholderText(/colony name/i)
    ).toBeInTheDocument()
  })

  it('calls onAdd with the trimmed name and notes', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ColoniesSection colonyRecords={[]} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.type(screen.getByPlaceholderText(/colony name/i), '  Cherry  ')
    await user.type(screen.getByPlaceholderText(/notes/i), 'Young colony')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onAdd).toHaveBeenCalledWith('Cherry', 'Young colony')
  })

  it('does not submit when the name is empty', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ColoniesSection colonyRecords={[]} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('cancel closes the add form without calling onAdd', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ColoniesSection colonyRecords={[]} onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /add a colony/i }))
    await user.type(screen.getByPlaceholderText(/colony name/i), 'Discarded')
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText(/colony name/i)).not.toBeInTheDocument()
  })

  it('enters edit mode and calls onUpdate with the new values', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ColoniesSection colonyRecords={sampleRecords} onUpdate={onUpdate} />)
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
    wrap(<ColoniesSection colonyRecords={sampleRecords} onRemove={onRemove} />)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith('col-1')
  })

  it('does not call onRemove when the delete prompt is declined', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    vi.spyOn(window, 'confirm').mockImplementation(() => false)
    wrap(<ColoniesSection colonyRecords={sampleRecords} onRemove={onRemove} />)
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
    expect(onRemove).not.toHaveBeenCalled()
  })

  describe('delete confirmation text', () => {
    const inspectionsFor = (colonyId, n) =>
      Array.from({ length: n }, (_, i) => ({ id: `${colonyId}-${i}`, colonyId, date: `2026-04-${String(i + 1).padStart(2, '0')}` }))

    async function confirmText(locale, count, name = 'Apple tree') {
      localStorage.setItem('apiario-locale', locale)
      const user = userEvent.setup()
      const confirm = vi.spyOn(window, 'confirm').mockImplementation(() => false)
      const records = buildColonyRecords(
        [{ id: 'col-1', name, createdAt: '2026-03-01', notes: '' }],
        inspectionsFor('col-1', count)
      )
      wrap(<ColoniesSection colonyRecords={records} onRemove={() => {}} />)
      await user.click(screen.getAllByRole('button', { name: /remove|entfernen/i })[0])
      return confirm.mock.calls[0][0]
    }

    it.each([
      ['en', 0, 'Really remove the colony “Apple tree”? It has no inspections.'],
      ['en', 1, 'Really remove the colony “Apple tree”? Its 1 inspection will also be deleted.'],
      ['en', 3, 'Really remove the colony “Apple tree”? Its 3 inspections will also be deleted.'],
      ['de', 0, 'Volk „Apple tree“ wirklich entfernen? Es hat keine Kontrollen.'],
      ['de', 1, 'Volk „Apple tree“ wirklich entfernen? Die 1 Kontrolle wird ebenfalls gelöscht.'],
      ['de', 3, 'Volk „Apple tree“ wirklich entfernen? Die 3 Kontrollen werden ebenfalls gelöscht.'],
    ])('%s with %i inspections reads correctly', async (locale, count, expected) => {
      expect(await confirmText(locale, count)).toBe(expected)
    })

    it('counts only the inspections of the colony being removed', async () => {
      localStorage.setItem('apiario-locale', 'en')
      const user = userEvent.setup()
      const confirm = vi.spyOn(window, 'confirm').mockImplementation(() => false)
      const records = buildColonyRecords(sampleColonies, [
        ...inspectionsFor('col-1', 2),
        ...inspectionsFor('col-2', 5),
      ])
      wrap(<ColoniesSection colonyRecords={records} onRemove={() => {}} />)
      await user.click(screen.getAllByRole('button', { name: /remove/i })[1])
      expect(confirm.mock.calls[0][0]).toContain('“Garden”')
      expect(confirm.mock.calls[0][0]).toContain('5 inspections')
    })

    it('keeps a colony name containing a placeholder literal', async () => {
      expect(await confirmText('en', 2, '{count} $& {name}')).toContain('“{count} $& {name}”')
    })
  })

  describe('delete with real storage', () => {
    function Harness() {
      const profile = useProfile()
      const inspections = useInspections()
      const removal = useColonyRemoval(profile.removeColony, inspections.removeInspectionsByColonyId)
      const records = buildColonyRecords(profile.profile.colonies, inspections.inspections)
      return <ColoniesSection colonyRecords={records} onRemove={removal.remove} onSelectColony={() => {}} />
    }
    const seed = () => {
      localStorage.setItem('apiario-profile', JSON.stringify({
        schemaVersion: 3,
        colonies: [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Birch' }],
      }))
      localStorage.setItem('apiario-inspections', JSON.stringify([
        { id: 'i1', colonyId: 'a', date: '2026-04-01' },
        { id: 'i2', colonyId: 'a', date: '2026-04-02' },
        { id: 'i3', colonyId: 'b', date: '2026-04-03' },
      ]))
    }

    it('cancelling leaves the colony, its inspections and storage untouched', async () => {
      seed()
      const before = [localStorage.getItem('apiario-profile'), localStorage.getItem('apiario-inspections')]
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockImplementation(() => false)
      wrap(<Harness />)
      await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
      expect(screen.getByText(/Apple/)).toBeInTheDocument()
      expect([localStorage.getItem('apiario-profile'), localStorage.getItem('apiario-inspections')]).toEqual(before)
    })

    it('confirming removes the colony and only its inspections together', async () => {
      seed()
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockImplementation(() => true)
      wrap(<Harness />)
      await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
      expect(screen.queryByText(/Apple/)).not.toBeInTheDocument()
      expect(screen.getByText(/Birch/)).toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem('apiario-profile')).colonies.map((c) => c.id)).toEqual(['b'])
      const storedInspections = JSON.parse(localStorage.getItem('apiario-inspections'))
      const inspectionRecords = Array.isArray(storedInspections) ? storedInspections : storedInspections.records
      expect(inspectionRecords.map((i) => i.id)).toEqual(['i3'])
    })
  })

  it('reports an unreadable inspection date instead of "never inspected"', () => {
    // The latest inspection is dated, but its age cannot be computed, so the
    // record reports the 'unknown' status rather than 'never'.
    const unknown = buildColonyRecord(
      { id: 'col-3', name: 'Cherry', createdAt: '2026-03-09', notes: '' },
      [{ id: 'i9', colonyId: 'col-3', date: '2026-05-01' }],
      { today: new Date('unusable') }
    )
    expect(unknown.lastInspected).toEqual({ kind: 'unknown' })
    wrap(<ColoniesSection colonyRecords={[unknown]} />)
    expect(screen.getByText(/Last inspected: Unknown inspection date/)).toBeInTheDocument()
    expect(screen.queryByText(/Never inspected/)).not.toBeInTheDocument()
  })
})
