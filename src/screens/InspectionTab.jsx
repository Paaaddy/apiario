import { useState, useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import InspectionCard from '../components/InspectionCard'
import InspectionForm from '../components/InspectionForm'

const MAX_VISIBLE = 5

export default function InspectionTab({
  colonies = [],
  inspections = [],
  onAdd,
  onUpdate,
  onDelete,
}) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [expandedColonies, setExpanded] = useState({})

  const isDark = theme === 'c'
  const inkMid = isDark ? 'rgba(255,255,255,0.55)' : theme === 'b' ? '#6b5838' : '#92400e'
  const ink    = isDark ? '#fff'    : theme === 'b' ? '#2b1d0e' : '#3d1f00'

  const colonyMap = useMemo(
    () => Object.fromEntries(colonies.map((c) => [c.id, c.name])),
    [colonies]
  )

  const byColony = useMemo(() => {
    const map = {}
    for (const insp of inspections) {
      if (!map[insp.colonyId]) map[insp.colonyId] = []
      map[insp.colonyId].push(insp)
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => b.date.localeCompare(a.date))
    }
    return map
  }, [inspections])

  function openAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(inspection) {
    setEditTarget(inspection)
    setFormOpen(true)
  }

  function handleSave(data) {
    if (editTarget) {
      onUpdate(editTarget.id, data)
    } else {
      onAdd(data)
    }
  }

  function toggleColonyExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (inspections.length === 0) {
    return (
      <div style={{ paddingTop: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
        <p style={{ fontSize: 14, color: inkMid, maxWidth: 280, margin: '0 auto 20px' }}>
          {t(s.insp_tab_empty)}
        </p>
        <button
          type="button"
          onClick={openAdd}
          style={{ padding: '12px 24px', borderRadius: 24, background: '#f5a623', border: 'none', color: '#3d1f00', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          {t(s.insp_add_button)}
        </button>
        {formOpen && (
          <InspectionForm
            colonies={colonies}
            initial={editTarget}
            onSave={handleSave}
            onClose={() => setFormOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          onClick={openAdd}
          style={{ padding: '10px 18px', borderRadius: 24, background: '#f5a623', border: 'none', color: '#3d1f00', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          {t(s.insp_add_button)}
        </button>
      </div>

      {/* Grouped by colony — only colonies with inspections */}
      {colonies
        .filter((c) => byColony[c.id]?.length > 0)
        .map((colony) => {
          const list    = byColony[colony.id] ?? []
          const showAll = expandedColonies[colony.id]
          const visible = showAll ? list : list.slice(0, MAX_VISIBLE)

          return (
            <section key={colony.id} style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: ink, position: 'sticky', top: 0, paddingTop: 4, paddingBottom: 4 }}>
                🐝 {colony.name}
              </h3>
              {visible.map((insp) => (
                <InspectionCard
                  key={insp.id}
                  inspection={insp}
                  colonyName={null}
                  onEdit={openEdit}
                  onDelete={onDelete}
                />
              ))}
              {!showAll && list.length > MAX_VISIBLE && (
                <button
                  type="button"
                  onClick={() => toggleColonyExpand(colony.id)}
                  style={{ fontSize: 13, color: inkMid, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                >
                  {t(s.insp_show_all)} ({list.length})
                </button>
              )}
            </section>
          )
        })}

      {/* Orphaned inspections for deleted colonies */}
      {(() => {
        const orphans = inspections.filter((i) => !colonyMap[i.colonyId])
        if (orphans.length === 0) return null
        return (
          <section style={{ marginBottom: 24 }}>
            {orphans.map((insp) => (
              <InspectionCard
                key={insp.id}
                inspection={insp}
                colonyName="–"
                onEdit={openEdit}
                onDelete={onDelete}
              />
            ))}
          </section>
        )
      })()}

      {formOpen && (
        <InspectionForm
          colonies={colonies}
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
