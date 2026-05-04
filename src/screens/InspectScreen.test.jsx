import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import InspectScreen from './InspectScreen'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui, theme = 'a') {
  localStorage.setItem('apiario-theme', theme)
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

const colony = { id: 'c1', name: 'Hive 1', notes: '', createdAt: '2025-01-01' }
const defaultProps = {
  colonies: [colony],
  inspections: [],
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
}

describe('InspectScreen', () => {
  it('renders heading in theme A (Honeycomb)', () => {
    wrap(<InspectScreen {...defaultProps} />, 'a')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders heading in theme B (Field Notebook)', () => {
    wrap(<InspectScreen {...defaultProps} />, 'b')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders heading in theme C (Seasonal Light)', () => {
    wrap(<InspectScreen {...defaultProps} />, 'c')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('forwards colonies prop to InspectionTab — shows empty inspections message', () => {
    wrap(<InspectScreen {...defaultProps} />, 'a')
    expect(screen.getByText(/no inspections yet/i)).toBeInTheDocument()
  })

  it('shows no-colonies message when colonies array is empty', () => {
    wrap(<InspectScreen {...defaultProps} colonies={[]} />, 'a')
    expect(screen.getByText(/add a colony/i)).toBeInTheDocument()
  })
})
