import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'
import LearnScreen from './LearnScreen'
import knowledge from '../data/knowledge.json'

beforeEach(() => {
  localStorage.setItem('apiario-locale', 'en')
})
afterEach(() => {
  localStorage.clear()
})

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

describe('LearnScreen', () => {
  it('renders every fact as a card', () => {
    wrap(<LearnScreen />)
    for (const fact of knowledge) {
      expect(screen.getByText(fact.content.en.title)).toBeInTheDocument()
    }
  })

  it('shows the translated difficulty label, not the raw JSON value', () => {
    wrap(<LearnScreen />)
    expect(screen.getAllByText('Beginner').length).toBeGreaterThan(0)
    expect(screen.queryByText('beginner')).not.toBeInTheDocument()
  })

  it('filters facts by search text', () => {
    wrap(<LearnScreen />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'varroa mite thresholds' } })
    expect(screen.getByText('Varroa Mite Thresholds')).toBeInTheDocument()
    expect(screen.queryByText(knowledge.find(f => f.id === 'f5').content.en.title)).not.toBeInTheDocument()
  })

  it('shows the no-results message when nothing matches', () => {
    wrap(<LearnScreen />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'zzz-nonexistent-zzz' } })
    expect(screen.getByText('No entries found.')).toBeInTheDocument()
  })

  it('opens a detail modal with the translated source label', () => {
    wrap(<LearnScreen />)
    fireEvent.click(screen.getByText('Varroa Mite Thresholds'))
    expect(screen.getByText(/Source:/)).toBeInTheDocument()
    expect(screen.getByText(/Mississippi State Univ\. Extension P4049/)).toBeInTheDocument()
  })

  it('closes the detail modal', () => {
    wrap(<LearnScreen />)
    fireEvent.click(screen.getByText('Varroa Mite Thresholds'))
    fireEvent.click(screen.getByText('✕'))
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument()
  })
})
