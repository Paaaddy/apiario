import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

/**
 * Lists the user's colonies and lets them add / rename / annotate / remove.
 * All state lives in `useProfile` — this component is purely a view over
 * `profile.colonies` plus the three colony helpers.
 */
export default function ColoniesSection({
  colonies = [],
  onAdd,
  onUpdate,
  onRemove,
}) {
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function submitAdd() {
    const name = draftName.trim()
    if (!name) return
    onAdd?.(name, draftNotes.trim())
    setDraftName('')
    setDraftNotes('')
    setIsAdding(false)
  }

  function cancelAdd() {
    setDraftName('')
    setDraftNotes('')
    setIsAdding(false)
  }

  function beginEdit(colony) {
    setEditingId(colony.id)
    setEditName(colony.name)
    setEditNotes(colony.notes ?? '')
  }

  function submitEdit() {
    const name = editName.trim()
    if (!name) return
    onUpdate?.(editingId, { name, notes: editNotes.trim() })
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditNotes('')
  }

  function handleRemove(id) {
    if (window.confirm(t(s.colonies_delete_confirm))) {
      onRemove?.(id)
    }
  }

  return (
    <section className="mb-8">
      <h2 className="font-serif text-base font-semibold text-brown mb-3">
        {t(s.colonies_title)}
      </h2>

      {colonies.length === 0 && !isAdding && (
        <p className="text-sm text-brown-mid mb-3">{t(s.colonies_empty)}</p>
      )}

      <ul className="flex flex-col gap-2 mb-3">
        {colonies.map((colony) =>
          editingId === colony.id ? (
            <li
              key={colony.id}
              className="bg-white border border-honey rounded-xl p-3 shadow-sm"
            >
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t(s.colonies_name_placeholder)}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm"
                aria-label={t(s.colonies_name_placeholder)}
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t(s.colonies_notes_placeholder)}
                rows={2}
                className="w-full mt-2 border border-amber-200 rounded-lg px-3 py-2 text-sm resize-none"
                aria-label={t(s.colonies_notes_placeholder)}
              />
              <div className="mt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-brown-mid font-medium px-3 py-1.5 text-sm"
                >
                  {t(s.colonies_cancel)}
                </button>
                <button
                  type="button"
                  onClick={submitEdit}
                  className="bg-honey text-brown font-semibold rounded-lg px-3 py-1.5 text-sm"
                >
                  {t(s.colonies_save)}
                </button>
              </div>
            </li>
          ) : (
            <li
              key={colony.id}
              className="bg-white border border-amber-100 rounded-xl p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base font-semibold text-brown truncate">
                    🐝 {colony.name}
                  </h3>
                  {colony.notes && (
                    <p className="mt-1 text-sm text-brown-mid leading-relaxed">
                      {colony.notes}
                    </p>
                  )}
                  {colony.createdAt && (
                    <p className="mt-1 text-xs text-brown-mid/60">
                      {t(s.colonies_created_on)} {colony.createdAt}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => beginEdit(colony)}
                    className="text-xs text-brown-mid underline"
                  >
                    {t(s.colonies_edit)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(colony.id)}
                    className="text-xs text-red-600 underline"
                  >
                    {t(s.colonies_delete)}
                  </button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>

      {isAdding ? (
        <div className="bg-white border border-honey rounded-xl p-3 shadow-sm">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={t(s.colonies_name_placeholder)}
            className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm"
            aria-label={t(s.colonies_name_placeholder)}
            autoFocus
          />
          <textarea
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder={t(s.colonies_notes_placeholder)}
            rows={2}
            className="w-full mt-2 border border-amber-200 rounded-lg px-3 py-2 text-sm resize-none"
            aria-label={t(s.colonies_notes_placeholder)}
          />
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancelAdd}
              className="text-brown-mid font-medium px-3 py-1.5 text-sm"
            >
              {t(s.colonies_cancel)}
            </button>
            <button
              type="button"
              onClick={submitAdd}
              className="bg-honey text-brown font-semibold rounded-lg px-3 py-1.5 text-sm"
            >
              {t(s.colonies_save)}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full border border-dashed border-amber-300 rounded-xl py-3 text-sm font-medium text-brown-mid"
        >
          {t(s.colonies_add_button)}
        </button>
      )}
    </section>
  )
}
