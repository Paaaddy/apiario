import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import TaskCard from './TaskCard'

function wrap(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

const task = {
  id: 'test-01',
  name: { de: 'Rähmchen kontrollieren', en: 'Inspect brood frames' },
  why: { de: 'Königin überprüfen.', en: 'Confirm the queen is laying.' },
  urgency: 'important',
}

describe('TaskCard', () => {
  it('renders task name and why in default locale (de)', () => {
    wrap(<TaskCard task={task} />)
    expect(screen.getByText('Rähmchen kontrollieren')).toBeInTheDocument()
    expect(screen.getByText('Königin überprüfen.')).toBeInTheDocument()
  })

  it('renders urgency badge (de)', () => {
    wrap(<TaskCard task={task} />)
    expect(screen.getByText('Wichtig')).toBeInTheDocument()
  })

  it('renders Dringend badge for urgent tasks', () => {
    wrap(<TaskCard task={{ ...task, urgency: 'urgent' }} />)
    expect(screen.getByText('Dringend')).toBeInTheDocument()
  })

  it('renders Routine badge for routine tasks', () => {
    wrap(<TaskCard task={{ ...task, urgency: 'routine' }} />)
    expect(screen.getByText('Routine')).toBeInTheDocument()
  })

  it('renders checkbox when onToggle is provided', () => {
    wrap(<TaskCard task={task} onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: /check task/i })).toBeInTheDocument()
  })

  it('does not render checkbox when onToggle is not provided', () => {
    wrap(<TaskCard task={task} />)
    expect(screen.queryByRole('button', { name: /check task/i })).not.toBeInTheDocument()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn()
    wrap(<TaskCard task={task} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: /check task/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('shows Erledigt badge and strikes out name when isChecked', () => {
    wrap(<TaskCard task={task} isChecked onToggle={() => {}} checkedDate="2026-04-13" />)
    expect(screen.getByText(/Erledigt · 13\.04/)).toBeInTheDocument()
    expect(screen.getByText('Rähmchen kontrollieren')).toHaveClass('line-through')
  })

  it('hides why text when isChecked', () => {
    wrap(<TaskCard task={task} isChecked onToggle={() => {}} />)
    expect(screen.queryByText('Königin überprüfen.')).not.toBeInTheDocument()
  })
})
