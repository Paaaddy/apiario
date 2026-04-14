import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import RiskNote from './RiskNote'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('RiskNote', () => {
  it('renders nothing when risk is missing', () => {
    const { container } = wrap(<RiskNote risk={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a caution-level note with the mitigation', () => {
    wrap(
      <RiskNote
        risk={{
          level: 'caution',
          note: { de: 'Offen', en: 'Open water drowns bees' },
          mitigation: { de: 'Korken', en: 'Float corks' },
        }}
      />
    )
    expect(screen.getByRole('note')).toBeInTheDocument()
    expect(screen.getByText(/note for bee welfare/i)).toBeInTheDocument()
    expect(screen.getByText(/open water drowns bees/i)).toBeInTheDocument()
    expect(screen.getByText(/how to avoid harm/i)).toBeInTheDocument()
    expect(screen.getByText(/float corks/i)).toBeInTheDocument()
  })

  it('renders a warning-level note with the stronger label', () => {
    wrap(
      <RiskNote
        risk={{
          level: 'warning',
          note: { de: 'Ü', en: 'Overharvesting starves the colony' },
          mitigation: { de: 'k', en: 'Leave 15–20 kg of honey' },
        }}
      />
    )
    expect(screen.getByRole('note')).toHaveAccessibleName(/risk to the bees/i)
    expect(screen.getByText(/overharvesting starves the colony/i)).toBeInTheDocument()
    expect(screen.getByText(/leave 15–20 kg of honey/i)).toBeInTheDocument()
  })

  it('omits the mitigation section when no mitigation is provided', () => {
    wrap(
      <RiskNote
        risk={{
          level: 'caution',
          note: { de: 'x', en: 'Generic caution' },
        }}
      />
    )
    expect(screen.getByText(/generic caution/i)).toBeInTheDocument()
    expect(screen.queryByText(/how to avoid harm/i)).not.toBeInTheDocument()
  })
})
