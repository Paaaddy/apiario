export function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = isoDate.split('-')
  return `${day}.${month}`
}
