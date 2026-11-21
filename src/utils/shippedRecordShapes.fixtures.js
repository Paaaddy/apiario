// Test fixtures: one record for every Inspection and task-log shape a shipped
// build wrote before record versioning existed (schema version 0). Each shape
// is copied from the writer at the named release, so a migration test fails
// if a later change stops reading what real devices hold.

// v2.0.0 (e17baf5, InspectionForm onSave): the first Inspection journal.
export const INSPECTION_V2_0_0 = {
  id: '6f1c2b8e-0d1a-4c2e-9a51-1f0a7d3c2b10',
  colonyId: 'col-1',
  date: '2026-05-02',
  queenStatus: 'seen',
  broodPattern: 4,
  honeyStores: 3,
  population: 5,
  temperament: 'calm',
  varroa: 1.5,
  treatment: 'Oxalsäure',
  notes: 'Ruhiges Volk',
  createdAt: '2026-05-02T09:12:06.000Z',
}

// v2.4.0 (a08495c): adds queenYear and harvest; nulls for untouched fields.
export const INSPECTION_V2_4_0 = {
  id: '0b6f0e8a-1c55-4a5f-8a3b-7e2d9c4f1a22',
  colonyId: 'col-2',
  date: '2026-07-14',
  queenStatus: 'eggs',
  queenYear: '2025',
  broodPattern: null,
  honeyStores: 5,
  population: null,
  temperament: null,
  varroa: null,
  treatment: null,
  harvest: 12.5,
  notes: null,
  createdAt: '2026-07-14T16:40:00.000Z',
}

// v2.8.0 (inspectionFromDraft): treatment presets, 0-5 scales.
export const INSPECTION_V2_8_0 = {
  id: '9d3e4f50-6a7b-4c8d-9e0f-a1b2c3d4e5f6',
  colonyId: 'col-1',
  date: '2026-09-30',
  queenStatus: 'not_seen',
  queenYear: null,
  broodPattern: 0,
  honeyStores: 2,
  population: 3,
  temperament: 'defensive',
  varroa: 4,
  treatment: 'varroa',
  harvest: null,
  notes: 'Varroa high after harvest',
  createdAt: '2026-09-30T08:00:00.000Z',
}

// Chronology contract: an unreadable date is retained, not repaired.
export const INSPECTION_INVALID_DATE = {
  id: 'legacy-invalid-date',
  colonyId: 'col-2',
  date: '2026-02-30',
  queenStatus: 'larvae',
  notes: 'Typed by hand',
  createdAt: '2026-03-01T10:00:00.000Z',
}

export const SHIPPED_INSPECTIONS = [INSPECTION_V2_0_0, INSPECTION_V2_4_0, INSPECTION_V2_8_0, INSPECTION_INVALID_DATE]

// v1.0.0 (0034858, useTaskLog): Date.now() identifiers.
export const LOG_TASK_V1_0_0 = {
  id: 'task-sp-01-1776150000000',
  type: 'task',
  taskId: 'sp-01',
  taskName: { de: 'Erste Frühjahrskontrolle', en: 'First hive inspection' },
  completedAt: '2026-04-14',
}

export const LOG_CUSTOM_V1_0_0 = {
  id: 'custom-1776150000001',
  type: 'custom',
  text: 'Fluglochkeil entfernt',
  date: '2026-04-14',
}

// v2.8.0: randomUUID identifiers.
export const LOG_TASK_V2_8_0 = {
  id: 'task-su-02-3f2a1b0c-9d8e-4f7a-b6c5-d4e3f2a1b0c9',
  type: 'task',
  taskId: 'su-02',
  taskName: { de: 'Honigraum aufsetzen', en: 'Add honey super' },
  completedAt: '2026-06-01',
}

// Loading has always tolerated a task entry without its name.
export const LOG_TASK_WITHOUT_NAME = {
  id: 'task-sp-03-legacy',
  type: 'task',
  taskId: 'sp-03',
  completedAt: '2026-04-20',
}

export const SHIPPED_LOG = [LOG_TASK_V2_8_0, LOG_TASK_V1_0_0, LOG_CUSTOM_V1_0_0, LOG_TASK_WITHOUT_NAME]

// The profile those Inspections belong to (version 3, shipped since v2.4.0).
export const SHIPPED_PROFILE = {
  schemaVersion: 3,
  hiveCount: 2,
  climateZone: 'central',
  experience: 1,
  onboardingDone: true,
  colonies: [
    { id: 'col-1', name: 'Linde', notes: '', createdAt: '2026-04-01', queenIntroducedAt: null, harvestLog: [] },
    { id: 'col-2', name: 'Akazie', notes: '', createdAt: '2026-04-01', queenIntroducedAt: null, harvestLog: [] },
  ],
}

export const stampedAt = (version) => (record) => ({ ...record, schemaVersion: version })
