import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskCard from './TaskCard'

const task = { id: 'test-01', name: 'Inspect brood frames', why: 'Confirm the queen is laying.', urgency: 'important' }

describe('TaskCard', () => {
  it('renders task name and why', () => {
    render(<TaskCard task={task} />)
    expect(screen.getByText('Inspect brood frames')).toBeInTheDocument()
    expect(screen.getByText('Confirm the queen is laying.')).toBeInTheDocument()
  })

  it('renders urgency badge', () => {
    render(<TaskCard task={task} />)
    expect(screen.getByText('Important')).toBeInTheDocument()
  })

  it('renders Urgent badge for urgent tasks', () => {
    render(<TaskCard task={{ ...task, urgency: 'urgent' }} />)
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('renders Routine badge for routine tasks', () => {
    render(<TaskCard task={{ ...task, urgency: 'routine' }} />)
    expect(screen.getByText('Routine')).toBeInTheDocument()
  })
})
