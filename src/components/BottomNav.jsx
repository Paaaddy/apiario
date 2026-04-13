import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function BottomNav({ activeTab, onTabChange }) {
  const { t } = useLanguage()

  const TABS = [
    { key: 'season',   label: t(s.nav_season),   icon: '📅' },
    { key: 'diagnose', label: t(s.nav_diagnose),  icon: '🔎' },
    { key: 'myhive',   label: t(s.nav_myhive),    icon: '🐝' },
  ]

  return (
    <nav className="bg-white border-t border-amber-100 flex">
      {TABS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
            activeTab === key ? 'text-honey' : 'text-gray-400'
          }`}
        >
          <span className="text-xl mb-0.5">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}
