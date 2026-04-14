import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import DiagnoseScreen from './DiagnoseScreen'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('DiagnoseScreen', () => {
  it('shows the root question on first render', () => {
    wrap(<DiagnoseScreen />)
    expect(screen.getByText(/what are you seeing/i)).toBeInTheDocument()
  })

  it('shows all root options', () => {
    wrap(<DiagnoseScreen />)
    expect(screen.getByText(/very few bees/i)).toBeInTheDocument()
    expect(screen.getByText(/dead bees in front/i)).toBeInTheDocument()
  })

  it('advances to the next question when an option is selected', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    expect(await screen.findByText(/when did you last inspect/i)).toBeInTheDocument()
  })

  it('shows "Start over" button after first selection', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    expect(await screen.findByText(/start over/i)).toBeInTheDocument()
  })

  it('shows a diagnosis result at a leaf node', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(await screen.findByText(/more than a month ago/i))
    expect(await screen.findByText(/unknown — inspection overdue/i)).toBeInTheDocument()
  })

  it('resets to the root question when start over is clicked', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(await screen.findByText(/start over/i))
    expect(await screen.findByText(/what are you seeing/i)).toBeInTheDocument()
  })
})
