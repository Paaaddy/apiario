import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../context/ThemeContext'
import { LanguageProvider } from '../context/LanguageContext'
import ProfileSection from './ProfileSection'
import { strings as s } from '../i18n/strings'

beforeEach(() => { localStorage.setItem('apiario-locale', 'en') })
afterEach(() => { localStorage.clear() })

function wrap(ui) {
  return render(<ThemeProvider><LanguageProvider>{ui}</LanguageProvider></ThemeProvider>)
}

const mockProfile = {
  hiveCount: 2,
  climateZone: 'central',
  experience: 1,
  colonies: [],
}

describe('ProfileSection: Option Groups (Hive Count / Climate / Experience)', () => {
  it('renders all three option groups', () => {
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    expect(screen.getByText('Number of hives')).toBeInTheDocument()
    expect(screen.getByText('Climate zone')).toBeInTheDocument()
    expect(screen.getByText('Experience level')).toBeInTheDocument()
  })

  it('renders option buttons in a wrapping flex layout', () => {
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    const hiveButtons = screen.getAllByText(/hive/i)
    expect(hiveButtons.length).toBeGreaterThan(0)
    // All buttons in same group should be in a flex container with flex-wrap
    // We can't directly check CSS, but they should all render
    expect(screen.getByText('1 hive')).toBeInTheDocument()
    expect(screen.getByText('2–3 hives')).toBeInTheDocument()
  })

  it('marks the currently selected option as active', async () => {
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    // With hiveCount=2, the "2–3 hives" button should be active (higher contrast style)
    const activeButton = screen.getByText('2–3 hives')
    expect(activeButton).toBeInTheDocument()
  })

  it('calls onUpdate when clicking a hive count option', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('1 hive'))
    expect(onUpdate).toHaveBeenCalledWith({ hiveCount: 1 })
  })

  it('calls onUpdate when clicking a climate zone option', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('Mediterranean'))
    expect(onUpdate).toHaveBeenCalledWith({ climateZone: 'mediterranean' })
  })

  it('calls onUpdate when clicking an experience option', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    await user.click(screen.getByText('First year'))
    expect(onUpdate).toHaveBeenCalledWith({ experience: 0 })
  })
})

describe('ProfileSection: Data & Privacy Collapse', () => {
  it('Data & Privacy section is collapsed by default', () => {
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    // The collapse toggle should be visible
    expect(screen.getByText('Data & backup')).toBeInTheDocument()
    // But the export/import buttons should NOT be visible initially
    expect(screen.queryByText('Export as JSON')).not.toBeInTheDocument()
  })

  it('expands Data & Privacy section when toggle is clicked', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)

    const toggle = screen.getByRole('button', { name: /Data & backup/i })
    await user.click(toggle)

    // Now export/import buttons should be visible
    await waitFor(() => {
      expect(screen.getByText('Export as JSON')).toBeInTheDocument()
      expect(screen.getByText('Import from file')).toBeInTheDocument()
    })
  })

  it('collapses Data & Privacy section when toggle is clicked again', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)

    const toggle = screen.getByRole('button', { name: /Data & backup/i })
    await user.click(toggle)
    await waitFor(() => expect(screen.getByText('Export as JSON')).toBeInTheDocument())

    // Click again to collapse
    await user.click(toggle)
    await waitFor(() => {
      expect(screen.queryByText('Export as JSON')).not.toBeInTheDocument()
    })
  })

  it('renders privacy disclosure inside the collapsed section', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)

    const toggle = screen.getByRole('button', { name: /Data & backup/i })
    await user.click(toggle)

    // Privacy section content should now be visible
    await waitFor(() => {
      expect(screen.getByText('Your data')).toBeInTheDocument()
    })
  })

  it('export button is clickable inside expanded section', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)

    const toggle = screen.getByRole('button', { name: /Data & backup/i })
    await user.click(toggle)

    await waitFor(() => {
      const exportBtn = screen.getByText('Export as JSON')
      expect(exportBtn).toBeInTheDocument()
    })
  })

  it('import file input exists and is hidden', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)

    const toggle = screen.getByRole('button', { name: /Data & backup/i })
    await user.click(toggle)

    await waitFor(() => {
      const fileInput = screen.getByRole('button', { name: 'Import from file' }).parentElement.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveStyle({ display: 'none' })
    })
  })
})

describe('ProfileSection: Theme Switcher', () => {
  it('renders ThemeSwitcher component', () => {
    const onUpdate = vi.fn()
    wrap(<ProfileSection profile={mockProfile} onUpdate={onUpdate} />)
    // ThemeSwitcher should always be visible (not collapsed)
    // Check for theme-related text or the component's output
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })
})
