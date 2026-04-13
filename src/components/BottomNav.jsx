const TABS = [
  { key: 'season', label: 'Season', icon: '📅' },
  { key: 'diagnose', label: 'Diagnose', icon: '🔎' },
  { key: 'myhive', label: 'My Hive', icon: '🐝' },
]

export default function BottomNav({ activeTab, onTabChange }) {
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
