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

describe('DiagnoseScreen back and restore (#192)', () => {
  it('disables Back on the first question and enables it afterwards', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    const back = screen.getByRole('button', { name: 'Back' })
    expect(back).toBeDisabled()
    await user.click(screen.getByText(/very few bees/i))
    expect(await screen.findByRole('button', { name: 'Back' })).toBeEnabled()
  })

  it('a mis-tap costs one question: Back returns to the previous question', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(await screen.findByRole('button', { name: 'Back' }))
    expect(await screen.findByText(/what are you seeing/i)).toBeInTheDocument()
  })

  it('Back is reachable from a result', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(await screen.findByText(/more than a month ago/i))
    await screen.findByText(/unknown — inspection overdue/i)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByText(/when did you last inspect/i)).toBeInTheDocument()
  })

  it('restores the current question after the screen unmounts (tab switch) and remounts', async () => {
    const user = userEvent.setup()
    const first = wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await screen.findByText(/when did you last inspect/i)
    first.unmount()
    wrap(<DiagnoseScreen />)
    expect(screen.getByText(/when did you last inspect/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByText(/what are you seeing/i)).toBeInTheDocument()
  })

  it('Start over forgets the walk', async () => {
    const user = userEvent.setup()
    const first = wrap(<DiagnoseScreen />)
    await user.click(screen.getByText(/very few bees/i))
    await user.click(await screen.findByText(/start over/i))
    first.unmount()
    wrap(<DiagnoseScreen />)
    expect(screen.getByText(/what are you seeing/i)).toBeInTheDocument()
  })

  it('starts at the root, without error, when the stored path names a removed node', () => {
    sessionStorage.setItem('apiario-diagnosis-path', JSON.stringify({ schemaVersion: 1, path: ['root', 'no-such-node'] }))
    wrap(<DiagnoseScreen />)
    expect(screen.getByText(/what are you seeing/i)).toBeInTheDocument()
  })

  it('names the Back button in German', () => {
    localStorage.setItem('apiario-locale', 'de')
    wrap(<DiagnoseScreen />)
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument()
  })

  it('shows the step count without a misleading total at the root, then a total that is reached exactly', async () => {
    const user = userEvent.setup()
    wrap(<DiagnoseScreen />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await user.click(screen.getByText(/dead bees in front/i))
    await user.click(await screen.findByText(/just dead, in a pile/i))
    const bar = await screen.findByRole('progressbar')
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThan(Number(bar.getAttribute('aria-valuemax')))
  })
})
