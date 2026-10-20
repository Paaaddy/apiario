import {
  buildColonyRecord,
  buildColonyRecords,
  colonyMetricSeries,
  findColonyRecord,
  lastInspectedLabel,
  latestByColony,
  latestOverall,
  orderInspections,
} from './inspectionHistory'
import { strings as s } from '../i18n/strings'

const colony = { id: 'col-1', name: 'Apple tree' }

const inspections = [
  { id: 'i1', colonyId: 'col-1', date: '2026-05-01', varroa: 2, broodPattern: 3, population: 4, honeyStores: 3, harvest: 5 },
  { id: 'i2', colonyId: 'col-1', date: '2026-06-01', varroa: '4', broodPattern: 4, population: 5, honeyStores: 2, harvest: '7.5' },
  { id: 'i3', colonyId: 'col-2', date: '2026-06-05', varroa: 1, harvest: 3 },
]

describe('buildColonyRecord', () => {
  it('combines one colony with only its inspections', () => {
    const record = buildColonyRecord(colony, inspections, { today: new Date('2026-06-04') })
    expect(record.colony).toBe(colony)
    expect(record.history.map((i) => i.id)).toEqual(['i2', 'i1'])
    expect(record.latestInspection.id).toBe('i2')
    expect(record.inspectionCount).toBe(2)
  })

  it('derives harvest total and metric series defensively', () => {
    const record = buildColonyRecord(
      colony,
      [
        ...inspections,
        { id: 'i4', colonyId: 'col-1', date: '2026-04-01', varroa: 'bad', harvest: 'oops' },
      ],
      { today: new Date('2026-06-04') }
    )
    expect(record.totalHarvestKg).toBe(12.5)
    expect(record.metrics.varroa.points).toEqual([
      { date: '2026-05-01', value: 2 },
      { date: '2026-06-01', value: 4 },
    ])
    expect(record.metrics.broodPattern.points.map((p) => p.value)).toEqual([3, 4])
  })

  it('returns stable last-inspected status codes', () => {
    expect(
      buildColonyRecord(colony, inspections, { today: new Date('2026-06-01') }).lastInspected
    ).toEqual({ kind: 'today' })
    expect(
      buildColonyRecord(colony, inspections, { today: new Date('2026-06-02') }).lastInspected
    ).toEqual({ kind: 'yesterday' })
    expect(
      buildColonyRecord(colony, inspections, { today: new Date('2026-06-04') }).lastInspected
    ).toEqual({ kind: 'daysAgo', days: 3 })
    expect(buildColonyRecord(colony, [], { today: new Date('2026-06-04') }).lastInspected).toEqual({ kind: 'never' })
  })

  it('pushes inspections with invalid dates to the end', () => {
    const record = buildColonyRecord(
      colony,
      [
        { id: 'bad', colonyId: 'col-1', date: 'not-a-date' },
        { id: 'good', colonyId: 'col-1', date: '2026-01-01' },
      ],
      { today: new Date('2026-06-04') }
    )
    expect(record.history.map((i) => i.id)).toEqual(['good', 'bad'])
  })

  it('returns null when no colony is provided', () => {
    expect(buildColonyRecord(null, inspections)).toBeNull()
  })
})

describe('buildColonyRecords', () => {
  it('builds and finds records by colony id', () => {
    const records = buildColonyRecords([colony, { id: 'col-2', name: 'Garden' }], inspections)
    expect(records).toHaveLength(2)
    expect(findColonyRecord(records, 'col-2').colony.name).toBe('Garden')
    expect(findColonyRecord(records, 'missing')).toBeNull()
  })
})

describe('orderInspections', () => {
  const entry = (id, date, createdAt) => ({ id, colonyId: 'c1', date, createdAt })

  it('sorts dated history newest first and keeps unusable dates last in input order', () => {
    const undated = [undefined, null, [], {}, '2026-02-29', 'garbage'].map((date, i) => entry(`undated-${i}`, date))
    const input = [undated[0], entry('older', '2026-01-01'), ...undated.slice(1), entry('newer', '2026-06-01')]
    const snapshot = structuredClone(input)
    expect(orderInspections(input).map((i) => i.id)).toEqual([
      'newer', 'older', 'undated-0', 'undated-1', 'undated-2', 'undated-3', 'undated-4', 'undated-5',
    ])
    expect(input).toEqual(snapshot)
  })

  it('reverses only the dated runs when asked for the oldest first', () => {
    const early = entry('early', '2026-05-01', '2026-05-01T08:00:00Z')
    const later = entry('later', '2026-05-01', '2026-05-01T09:00:00Z')
    const undated = entry('undated', 'not-a-date')
    const input = [early, undated, later]
    expect(orderInspections(input, { oldestFirst: true }).map((i) => i.id)).toEqual(['early', 'later', 'undated'])
  })

  it('breaks same-day ties by creation time, newest first', () => {
    const early = entry('early', '2026-05-01', '2026-05-01T08:00:00Z')
    const later = entry('later', '2026-05-01', '2026-05-01T09:00:00Z')
    const equal = entry('equal', '2026-05-01', later.createdAt)
    expect(orderInspections([early, equal, later]).map((i) => i.id)).toEqual(['equal', 'later', 'early'])
    expect(orderInspections([early, later, equal]).map((i) => i.id)).toEqual(['later', 'equal', 'early'])
    expect(orderInspections([early, equal, later], { oldestFirst: true }).map((i) => i.id)).toEqual(['early', 'equal', 'later'])
    expect(orderInspections([early, later, equal], { oldestFirst: true }).map((i) => i.id)).toEqual(['early', 'later', 'equal'])
  })

  it('treats a missing creation time as a barrier that stops the same-day run', () => {
    const first = entry('first', '2026-05-01', '2026-05-01T09:00:00Z')
    const barrier = entry('barrier', '2026-05-01', 'not-a-timestamp')
    const last = entry('last', '2026-05-01', '2026-05-01T07:00:00Z')
    for (const createdAt of [undefined, null, '', 'not-a-timestamp', [], {}]) {
      const input = [first, { ...barrier, createdAt }, last]
      const snapshot = structuredClone(input)
      expect(orderInspections(input).map((i) => i.id)).toEqual(['first', 'barrier', 'last'])
      expect(orderInspections(input, { oldestFirst: true }).map((i) => i.id)).toEqual(['first', 'barrier', 'last'])
      expect(input).toEqual(snapshot)
    }
  })

  it('orders each same-day run independently around a barrier', () => {
    const older = entry('older', '2026-05-01', '2026-05-01T07:00:00Z')
    const newer = entry('newer', '2026-05-01', '2026-05-01T09:00:00Z')
    const barrier = entry('barrier', '2026-05-01', null)
    const middle = entry('middle', '2026-05-01', '2026-05-01T08:00:00Z')
    // Without the barrier all four would sort to newer, middle, older, barrier.
    expect(orderInspections([older, newer, barrier, middle]).map((i) => i.id))
      .toEqual(['newer', 'older', 'barrier', 'middle'])
  })

  it('never lets a creation time move an inspection across a different date', () => {
    const previousDay = entry('previous-day', '2026-04-30', '2026-05-01T09:00:00Z')
    const sameDay = entry('same-day', '2026-05-01', '2026-05-01T07:00:00Z')
    expect(orderInspections([previousDay, sameDay]).map((i) => i.id)).toEqual(['same-day', 'previous-day'])
  })
})

describe('latestByColony and latestOverall', () => {
  it('can disagree when two colonies share the newest date', () => {
    const appleOld = { id: 'apple-old', colonyId: 'a', date: '2026-04-01' }
    const apple = { id: 'apple', colonyId: 'a', date: '2026-05-01', createdAt: '2026-05-01T08:00:00Z' }
    const birch = { id: 'birch', colonyId: 'b', date: '2026-05-01', createdAt: '2026-05-01T09:00:00Z' }
    const inspections = [appleOld, birch, apple]
    expect(latestByColony(inspections).get('a')).toBe(apple)
    expect(latestOverall(inspections)).toBe(birch)
  })

  it('takes the newest dated observation regardless of input position', () => {
    const stale = { id: 'stale', colonyId: 'a', date: '2026-05-01' }
    const fresh = { id: 'fresh', colonyId: 'b', date: '2026-05-20' }
    const undated = { id: 'undated', colonyId: 'c', date: '2099-99-99' }
    const inspections = [fresh, stale, undated]
    expect(latestByColony(inspections)).toEqual(new Map([['a', stale], ['b', fresh]]))
    expect(latestOverall(inspections)).toBe(fresh)
  })
})

describe('colonyMetricSeries', () => {
  it('carries the bounds, the label key and the oldest-first points of every metric', () => {
    const series = colonyMetricSeries(buildColonyRecord(colony, inspections, { today: new Date('2026-06-04') }))
    expect(series.map((entry) => entry.key)).toEqual(['varroa', 'broodPattern', 'population', 'honeyStores'])
    expect(series.map((entry) => [entry.min, entry.max, entry.lowerBetter]))
      .toEqual([[0, 10, true], [1, 5, false], [1, 5, false], [1, 5, false]])
    expect(series.map((entry) => entry.labelKey))
      .toEqual(['insp_varroa_label', 'insp_brood_label', 'insp_population_label', 'insp_honeystores_label'])
    expect(series.map((entry) => s[entry.labelKey].en))
      .toEqual(['Varroa / 100 bees', 'Brood pattern', 'Population', 'Honey stores'])
    expect(series.map((entry) => entry.points)).toEqual([
      [{ date: '2026-05-01', value: 2 }, { date: '2026-06-01', value: 4 }],
      [{ date: '2026-05-01', value: 3 }, { date: '2026-06-01', value: 4 }],
      [{ date: '2026-05-01', value: 4 }, { date: '2026-06-01', value: 5 }],
      [{ date: '2026-05-01', value: 3 }, { date: '2026-06-01', value: 2 }],
    ])
  })

  it('keeps the configured bounds for a colony without any inspection', () => {
    const series = colonyMetricSeries(buildColonyRecord(colony, [], { today: new Date('2026-06-04') }))
    expect(series.map((entry) => entry.points)).toEqual([[], [], [], []])
    expect(series.map((entry) => entry.max)).toEqual([10, 5, 5, 5])
  })

  it('degrades to empty series instead of throwing on a partial record', () => {
    expect(colonyMetricSeries(null).map((entry) => entry.points)).toEqual([[], [], [], []])
    expect(colonyMetricSeries({ colony }).map((entry) => entry.points)).toEqual([[], [], [], []])
  })
})

describe('lastInspectedLabel', () => {
  const t = (value) => (typeof value === 'string' ? value : value?.en ?? '')

  it.each([
    ['never', { kind: 'never' }, 'Never inspected'],
    ['today', { kind: 'today' }, 'Today'],
    ['yesterday', { kind: 'yesterday' }, 'Yesterday'],
    ['daysAgo', { kind: 'daysAgo', days: 3 }, '3 day(s) ago'],
    ['unknown', { kind: 'unknown' }, 'Unknown inspection date'],
    ['absent', null, 'Never inspected'],
    ['unrecognised', { kind: 'something-else' }, 'Never inspected'],
  ])('gives the %s status its own label', (_kind, status, label) => {
    expect(lastInspectedLabel(status, t, s)).toBe(label)
  })

  it('labels every status the record can report', () => {
    const today = new Date('2026-06-04')
    const statuses = [
      buildColonyRecord(colony, [], { today }).lastInspected,
      buildColonyRecord(colony, inspections, { today: new Date('2026-06-01') }).lastInspected,
      buildColonyRecord(colony, inspections, { today: new Date('2026-06-02') }).lastInspected,
      buildColonyRecord(colony, inspections, { today }).lastInspected,
      buildColonyRecord(colony, inspections, { today: new Date('unusable') }).lastInspected,
    ]
    expect(statuses).toEqual([
      { kind: 'never' },
      { kind: 'today' },
      { kind: 'yesterday' },
      { kind: 'daysAgo', days: 3 },
      { kind: 'unknown' },
    ])
    expect(statuses.map((status) => lastInspectedLabel(status, t, s))).toEqual([
      'Never inspected',
      'Today',
      'Yesterday',
      '3 day(s) ago',
      'Unknown inspection date',
    ])
  })
})
