// The only nodes an Inspection can jump to from the root; a stored path may
// legitimately hop root -> one of these without an option edge.
export const PREFILL_TARGETS = ['queenless', 'varroa-suspect', 'sick-brood']

export function routeFromInspection(inspection) {
  if (!inspection) return null
  if (inspection.queenStatus === 'not_seen') return 'queenless'
  if (inspection.varroa != null && inspection.varroa >= 3) return 'varroa-suspect'
  if (inspection.broodPattern != null && inspection.broodPattern <= 2) return 'sick-brood'
  return null
}
