import { useState } from 'react'

const KEYS = {
  profile: 'apiario-profile',
  log:     'apiario-log',
  locale:  'apiario-locale',
}

function readAll() {
  const out = {}
  for (const [name, key] of Object.entries(KEYS)) {
    try {
      const raw = localStorage.getItem(key)
      out[name] = raw ? JSON.parse(raw) : null
    } catch {
      out[name] = '(parse error)'
    }
  }
  return out
}

export default function DebugPanel() {
  const [data, setData] = useState(readAll)
  const [open, setOpen] = useState(true)

  function reset(keys) {
    for (const key of keys) localStorage.removeItem(key)
    setData(readAll())
  }

  function reloadAfter(keys) {
    reset(keys)
    window.location.reload()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-2 z-50 bg-gray-900 text-green-400 text-xs font-mono px-2 py-1 rounded opacity-70"
      >
        debug
      </button>
    )
  }

  return (
    <div className="fixed inset-x-2 bottom-24 z-50 bg-gray-900 text-green-400 font-mono text-xs rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
        <span className="font-bold text-white">🐛 Debug</span>
        <button onClick={() => setOpen(false)} className="text-gray-400 text-base leading-none">×</button>
      </div>

      <div className="px-3 py-2 flex flex-col gap-2 max-h-64 overflow-y-auto">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => reloadAfter([KEYS.profile])}
            className="bg-red-800 text-red-200 px-2 py-1 rounded text-xs"
          >
            Reset onboarding
          </button>
          <button
            onClick={() => reloadAfter([KEYS.log])}
            className="bg-yellow-800 text-yellow-200 px-2 py-1 rounded text-xs"
          >
            Clear log
          </button>
          <button
            onClick={() => reloadAfter(Object.values(KEYS))}
            className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs font-bold"
          >
            Reset all
          </button>
          <button
            onClick={() => setData(readAll())}
            className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
        </div>

        {/* State dump */}
        {Object.entries(data).map(([name, value]) => (
          <div key={name}>
            <p className="text-gray-400 uppercase tracking-widest text-[10px] mb-0.5">{name}</p>
            <pre className="text-green-300 text-[10px] leading-relaxed whitespace-pre-wrap break-all">
              {value === null ? '(empty)' : JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
