export function routeFromInspection(inspection) {
  if (!inspection) return null
  if (inspection.queenStatus === 'not_seen') return 'queenless'
  if (inspection.varroa != null && inspection.varroa >= 3) return 'varroa-suspect'
  if (inspection.broodPattern != null && inspection.broodPattern <= 2) return 'sick-brood'
  return null
}
