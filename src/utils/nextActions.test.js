import { buildNextActions } from './nextActions'

const springTask = {
  id: 'sp-01',
  name: { de: 'Frühjahrskontrolle', en: 'Spring inspection' },
  why: { de: 'Nach dem Winter prüfen.', en: 'Check colony health after winter.' },
  urgency: 'important',
}

const routineTask = {
  id: 'sp-02',
  name: { de: 'Werkzeug reinigen', en: 'Clean tools' },
  why: { de: 'Sauberes Werkzeug schützt die Bienen.', en: 'Clean tools protect the bees.' },
  urgency: 'routine',
}

describe('buildNextActions', () => {
  it('guides a new user through setup before seasonal work', () => {
    const actions = buildNextActions({
      profile: { colonies: [], experience: 0 },
      inspections: [],
      season: 'spring',
      tasks: [springTask],
      completedTaskIds: new Set(),
      today: new Date('2026-04-15T12:00:00Z'),
    })

    expect(actions[0]).toMatchObject({
      id: 'setup-add-colony',
      kind: 'setup',
      urgency: 'important',
      target: { tab: 'myhive' },
      title: { en: 'Add your first colony' },
      reason: { en: 'Next actions get smarter once Apiario knows what you keep.' },
    })
  })

  it('starts from first inspection when colonies exist without inspection history', () => {
    const actions = buildNextActions({
      profile: { colonies: [{ id: 'c1', name: 'Blue Hive' }], experience: 0 },
      inspections: [],
      season: 'spring',
      tasks: [springTask],
      completedTaskIds: new Set(),
      today: new Date('2026-04-15T12:00:00Z'),
    })

    expect(actions[0]).toMatchObject({
      id: 'setup-first-inspection',
      kind: 'setup',
      target: { tab: 'inspect' },
      title: { en: 'Record your first inspection' },
    })
  })

  it('surfaces diagnosis warnings before overdue inspections and seasonal work', () => {
    const actions = buildNextActions({
      profile: { colonies: [{ id: 'c1', name: 'Blue Hive' }], experience: 1 },
      inspections: [
        { id: 'i1', colonyId: 'c1', date: '2026-04-01', queenStatus: 'not_seen', varroa: 4 },
      ],
      season: 'spring',
      tasks: [springTask],
      completedTaskIds: new Set(),
      today: new Date('2026-04-15T12:00:00Z'),
    })

    expect(actions.map((action) => action.kind)).toEqual([
      'diagnosis-warning',
      'overdue-inspection',
      'seasonal-task',
    ])
    expect(actions[0]).toMatchObject({
      id: 'diagnosis-c1-queenless',
      target: { tab: 'diagnose' },
      title: { en: 'Possible issue in Blue Hive' },
      reason: { en: 'The latest inspection did not confirm the queen. Run diagnosis.' },
    })
  })

  it('groups several overdue colonies into one compact inspection action', () => {
    const actions = buildNextActions({
      profile: {
        colonies: [
          { id: 'c1', name: 'Blue Hive' },
          { id: 'c2', name: 'Garden Hive' },
        ],
        experience: 1,
      },
      inspections: [
        { id: 'i1', colonyId: 'c1', date: '2026-06-01', queenStatus: 'seen' },
        { id: 'i2', colonyId: 'c2', date: '2026-06-05', queenStatus: 'seen' },
      ],
      season: 'summer',
      tasks: [],
      completedTaskIds: new Set(),
      today: new Date('2026-06-18T12:00:00Z'),
    })

    expect(actions[0]).toMatchObject({
      id: 'overdue-inspections',
      kind: 'overdue-inspection',
      target: { tab: 'inspect' },
      title: { en: 'Inspect 2 colonies' },
      reason: { en: 'Oldest inspection was 17 days ago.' },
    })
  })

  it('uses season-aware overdue thresholds', () => {
    const colony = { id: 'c1', name: 'Blue Hive' }

    expect(buildNextActions({
      profile: { colonies: [colony], experience: 1 },
      inspections: [{ id: 'i1', colonyId: 'c1', date: '2026-01-01', queenStatus: 'seen' }],
      season: 'winter',
      tasks: [],
      completedTaskIds: new Set(),
      today: new Date('2026-01-20T12:00:00Z'),
    })[0].kind).toBe('all-clear')

    expect(buildNextActions({
      profile: { colonies: [colony], experience: 1 },
      inspections: [{ id: 'i1', colonyId: 'c1', date: '2026-04-01', queenStatus: 'seen' }],
      season: 'spring',
      tasks: [],
      completedTaskIds: new Set(),
      today: new Date('2026-04-12T12:00:00Z'),
    })[0]).toMatchObject({
      kind: 'overdue-inspection',
      title: { en: 'Inspect Blue Hive' },
      reason: { en: 'Last inspection was 11 days ago.' },
    })
  })

  it('selects the highest-priority incomplete seasonal task', () => {
    const actions = buildNextActions({
      profile: { colonies: [{ id: 'c1', name: 'Blue Hive' }], experience: 1 },
      inspections: [{ id: 'i1', colonyId: 'c1', date: '2026-04-14', queenStatus: 'seen' }],
      season: 'spring',
      tasks: [routineTask, springTask],
      completedTaskIds: new Set(['sp-02']),
      today: new Date('2026-04-15T12:00:00Z'),
    })

    expect(actions[0]).toMatchObject({
      id: 'seasonal-sp-01',
      kind: 'seasonal-task',
      urgency: 'important',
      target: { tab: 'season', taskId: 'sp-01' },
      title: { en: 'Spring inspection' },
      reason: { en: 'Check colony health after winter.' },
    })
  })

  it('returns a calm all-clear state when records are current and tasks are complete', () => {
    const actions = buildNextActions({
      profile: { colonies: [{ id: 'c1', name: 'Blue Hive' }], experience: 1 },
      inspections: [{ id: 'i1', colonyId: 'c1', date: '2026-04-14', queenStatus: 'seen' }],
      season: 'spring',
      tasks: [springTask],
      completedTaskIds: new Set(['sp-01']),
      today: new Date('2026-04-15T12:00:00Z'),
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({
      id: 'all-clear',
      kind: 'all-clear',
      urgency: 'routine',
      target: { tab: 'season' },
      title: { en: 'No urgent next actions' },
      reason: { en: 'Keep following the seasonal checklist.' },
    })
  })
})
