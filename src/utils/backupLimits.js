// Import resource ceilings, not limits on the number of Colonies a user may keep.
// Storage quotas vary by browser; passing this limit does not guarantee a write.
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024
export const MAX_LEGACY_SEEDED_COLONIES = 500
export const MAX_IMPORTED_COLONIES = 500
export const MAX_COLONY_NAME_LENGTH = 100
export const MAX_COLONY_NOTES_LENGTH = 300
