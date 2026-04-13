import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiagnoseScreen from './DiagnoseScreen'

describe('DiagnoseScreen', () => {
  it('shows the root question on first render', () => {
    render(<DiagnoseScreen />)
    expect(screen.getByText(/what are you seeing/i)).toBeInTheDocument()
  })

  it('shows all root options', () => {
    render(<DiagnoseScreen />)
    expect(screen.getByText(/very few bees/i)).toBeInTheDocument()
    expect(screen.getByText(/dead bees in front/i)).toBeInTheDocument()
  })

  it('advances to the next question when an option is selected', async () => {
    const user = userEvent.setup()
    render(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    expect(screen.getByText(/when did you last inspect/i)).toBeInTheDocument()
  })

  it('shows "Start over" button after first selection', async () => {
    const user = userEvent.setup()
    render(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    expect(screen.getByText(/start over/i)).toBeInTheDocument()
  })

  it('shows a diagnosis result at a leaf node', async () => {
    const user = userEvent.setup()
    render(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(screen.getByText(/more than a month ago/i))
    expect(screen.getByText(/unknown — inspection overdue/i)).toBeInTheDocument()
  })

  it('resets to the root question when start over is clicked', async () => {
    const user = userEvent.setup()
    render(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(screen.getByText(/start over/i))
    expect(screen.getByText(/what are you seeing/i)).toBeInTheDocument()
  })
})
