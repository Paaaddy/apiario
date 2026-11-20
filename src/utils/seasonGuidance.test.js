import { seasonGuidance } from './seasonGuidance'

const profile = {
  climateZone: 'central',
  experience: 0,
  colonies: [{ id: 'c1', name: 'Blue Hive' }],
}
const inspections = [{ id: 'i1', colonyId: 'c1', date: '2026-04-14', queenStatus: 'seen' }]
const springToday = new Date(2026, 3, 15)

function seasonalActionId(guidance) {
  return guidance.nextActions.find((action) => action.kind === 'seasonal-task')?.id
}

describe('seasonGuidance', () => {
  it('follows the browsed week for the seasonal Next action', () => {
    const guidance = seasonGuidance({
      profile, inspections, today: springToday, browsedDate: new Date(2026, 11, 15),
    })

    expect(guidance.season).toBe('winter')
    expect(guidance.tasks.every((task) => task.id.startsWith('wi-'))).toBe(true)
    expect(seasonalActionId(guidance)).toBe('seasonal-wi-04')
  })

  it('describes today when no week is browsed', () => {
    const guidance = seasonGuidance({ profile, inspections, today: springToday })

    expect(guidance.season).toBe('spring')
    expect(guidance.tasks.map((task) => task.id)).toContain('sp-01')
    expect(seasonalActionId(guidance)).toBe('seasonal-sp-01')
  })

  it('keeps the overdue-inspection threshold anchored on today while browsing another season', () => {
    // 20 days old: overdue by the spring threshold (10 days), not by the winter one (30 days).
    const stale = [{ id: 'i1', colonyId: 'c1', date: '2026-03-26', queenStatus: 'seen' }]
    const guidance = seasonGuidance({
      profile, inspections: stale, today: springToday, browsedDate: new Date(2026, 11, 15),
    })

    expect(guidance.season).toBe('winter')
    expect(guidance.nextActions.map((action) => action.kind)).toContain('overdue-inspection')
  })

  it('counts pending urgent and important tasks due today, not those of the browsed week', () => {
    const autumnToday = new Date(2026, 9, 15)
    const open = seasonGuidance({
      profile, inspections, today: autumnToday, browsedDate: new Date(2026, 11, 15),
    })
    const withOneDone = seasonGuidance({
      profile, inspections, today: autumnToday, completedTaskIds: new Set(['au-01']),
    })

    expect(open.pendingUrgentCount).toBe(5)
    expect(withOneDone.pendingUrgentCount).toBe(4)
  })
})
