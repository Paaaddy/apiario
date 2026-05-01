import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import { formatShortDate } from '../utils/format'

function formatMonthHeading(isoDate, locale) {
  if (!isoDate) return ''
  const [year, month] = isoDate.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function groupByMonth(log) {
  const groups = {}
  for (const entry of log) {
    const date = entry.completedAt || entry.date || ''
    const monthKey = date.slice(0, 7)
    if (!groups[monthKey]) groups[monthKey] = []
    groups[monthKey].push(entry)
  }
  return Object.keys(groups)
    .sort()
    .reverse()
    .map((key) => ({ monthKey: key, entries: groups[key] }))
}

export default function LogSection({ log = [], onAddEntry, onDeleteEntry }) {
  const { t, locale } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [formText, setFormText] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])

  function handleSave() {
    if (!formText.trim()) return
    onAddEntry?.({ text: formText.trim(), date: formDate })
    setFormText('')
    setFormDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
  }

  const grouped = groupByMonth(log)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-base font-semibold text-brown">{t(s.log_title)}</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs font-medium text-brown-mid border border-amber-200 px-3 py-1.5 rounded-full bg-white active:bg-amber-50 transition-colors"
        >
          {t(s.log_custom_btn)}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 bg-white rounded-xl p-4 border border-amber-100 shadow-sm flex flex-col gap-3">
          <textarea
            className="w-full text-sm text-brown border border-amber-100 rounded-lg px-3 py-2 resize-none outline-none focus:border-honey"
            rows={2}
            placeholder={t(s.log_placeholder)}
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-brown-mid shrink-0">{t(s.log_date_label)}</label>
            <input
              type="date"
              className="text-sm text-brown border border-amber-100 rounded-lg px-2 py-1 outline-none focus:border-honey flex-1"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-honey text-brown text-sm font-semibold py-2 rounded-lg active:bg-honey-dark transition-colors"
            >
              {t(s.log_save)}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-amber-50 text-brown-mid text-sm font-medium py-2 rounded-lg active:bg-amber-100 transition-colors"
            >
              {t(s.log_cancel)}
            </button>
          </div>
        </div>
      )}

      {log.length === 0 ? (
        <p className="text-sm text-brown-mid italic py-2">{t(s.log_empty)}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {grouped.map(({ monthKey, entries }) => (
            <div key={monthKey}>
              <p className="text-xs uppercase tracking-widest text-brown-mid/60 font-medium mt-3 mb-2">
                {formatMonthHeading(monthKey + '-01', locale)}
              </p>
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`relative bg-white rounded-xl px-4 py-3 border-l-4 shadow-sm ${
                      entry.type === 'task' ? 'border-green-400' : 'border-brown-mid'
                    }`}
                  >
                    <button
                      aria-label="Delete entry"
                      onClick={() => onDeleteEntry?.(entry.id)}
                      className="absolute top-2.5 right-2.5 text-brown-mid/40 hover:text-brown-mid text-xs leading-none"
                    >
                      ×
                    </button>
                    {entry.type === 'task' ? (
                      <>
                        <div className="flex items-center justify-between pr-4">
                          <span className="text-sm font-medium text-green-700">
                            ✓ {t(entry.taskName)}
                          </span>
                          <span className="text-xs text-brown-mid shrink-0 ml-2">
                            {formatShortDate(entry.completedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-brown-mid/60 mt-0.5">{t(s.log_task_subtitle)}</p>
                      </>
                    ) : (
                      <div className="flex items-start justify-between pr-4">
                        <span className="text-sm text-brown">📝 {entry.text}</span>
                        <span className="text-xs text-brown-mid shrink-0 ml-2">
                          {formatShortDate(entry.date)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
