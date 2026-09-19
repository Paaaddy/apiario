import {
  buildColonyRecord,
  buildColonyRecords,
  findColonyRecord,
} from './colonyRecords'

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
