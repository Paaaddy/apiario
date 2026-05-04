import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import InspectionTab from './InspectionTab'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

const colony = { id: 'c1', name: 'Hive 1', notes: '', createdAt: '2025-01-01' }
const noop = vi.fn()

describe('InspectionTab', () => {
  it('shows no-colonies message when colonies is empty', () => {
    wrap(<InspectionTab colonies={[]} inspections={[]} onAdd={noop} onUpdate={noop} onDelete={noop} />)
    expect(screen.getByText(/add a colony/i)).toBeInTheDocument()
  })

  it('shows empty-inspections message when colonies exist but inspections is empty', () => {
    wrap(<InspectionTab colonies={[colony]} inspections={[]} onAdd={noop} onUpdate={noop} onDelete={noop} />)
    expect(screen.getByText(/no inspections yet/i)).toBeInTheDocument()
  })

  it('shows add-inspection button when colonies exist and inspections is empty', () => {
    wrap(<InspectionTab colonies={[colony]} inspections={[]} onAdd={noop} onUpdate={noop} onDelete={noop} />)
    expect(screen.getByRole('button', { name: /inspect/i })).toBeInTheDocument()
  })
})
