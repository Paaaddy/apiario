import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function BeeFab({ onActivate, isActive }) {
  const { t } = useLanguage()

  return (
    <button
      aria-label={t(s.fab_label)}
      onClick={onActivate}
      style={{ '--chrome-origin': 'bottom right' }}
      className={`fixed-chrome fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 transition-all ${
        isActive
          ? 'bg-honey-dark border-honey animate-pulse-glow'
          : 'bg-honey border-honey-dark animate-bob'
      }`}
    >
      🐝
    </button>
  )
}
