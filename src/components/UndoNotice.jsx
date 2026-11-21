// A short-lived notice with one action. `role="status"` is a polite live
// region, so a screen reader announces the message when it appears.
export default function UndoNotice({ message, actionLabel, onAction }) {
  return (
    <div role="status" className="shrink-0 flex items-center justify-between gap-3 border-b border-honey-dark bg-cream p-3 text-brown">
      <p className="min-w-0 flex-1 text-sm font-semibold">{message}</p>
      <button type="button" onClick={onAction} className="min-h-11 min-w-11 rounded-lg bg-honey px-4 font-semibold text-brown">{actionLabel}</button>
    </div>
  )
}
