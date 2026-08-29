export function groupByColony(inspections) {
  const map = new Map()
  for (const e of inspections) {
    const arr = map.get(e.colonyId)
    if (arr) arr.push(e)
    else map.set(e.colonyId, [e])
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => b.date.localeCompare(a.date))
  }
  return map
}

export function latestByColony(inspections) {
  const grouped = groupByColony(inspections)
  const map = new Map()
  for (const [colonyId, arr] of grouped) map.set(colonyId, arr[0])
  return map
}

export function latestOverall(inspections) {
  let latest = null
  for (const e of inspections) {
    if (!latest || e.date.localeCompare(latest.date) > 0) latest = e
  }
  return latest
}
