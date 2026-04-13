const URGENCY_STYLES = {
  urgent:    { label: 'Urgent',    border: 'border-red-400',  badge: 'bg-red-100 text-red-700' },
  important: { label: 'Important', border: 'border-honey',    badge: 'bg-amber-100 text-brown-mid' },
  routine:   { label: 'Routine',   border: 'border-gray-200', badge: 'bg-gray-100 text-gray-500' },
}

export default function TaskCard({ task }) {
  const style = URGENCY_STYLES[task.urgency] ?? URGENCY_STYLES.routine

  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 ${style.border} shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base font-semibold text-brown leading-snug flex-1">
          {task.name}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-brown-mid leading-relaxed">{task.why}</p>
    </div>
  )
}
