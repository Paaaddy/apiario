import { useState } from 'react'
import { haptics } from '../utils/haptics'

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
  const [vibrateResult, setVibrateResult] = useState(null)

  function reset(keys) {
    for (const key of keys) localStorage.removeItem(key)
    setData(readAll())
  }

  function reloadAfter(keys) {
    reset(keys)
    window.location.reload()
  }

  function testVibration() {
    // Fire directly from the click handler — the whole point of this
    // button is to confirm the user-activation path actually works.
    const fired = haptics.tap()
    setVibrateResult({
      supported: haptics.isSupported,
      fired: fired !== false,
      at: new Date().toLocaleTimeString(),
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ '--chrome-origin': 'bottom left' }}
        className="fixed-chrome fixed bottom-24 left-2 z-50 bg-gray-900 text-green-400 text-xs font-mono px-2 py-1 rounded opacity-70"
      >
        debug
      </button>
    )
  }

  return (
    <div
      style={{ '--chrome-origin': 'bottom center' }}
      className="fixed-chrome fixed inset-x-2 bottom-24 z-50 bg-gray-900 text-green-400 font-mono text-xs rounded-xl shadow-2xl overflow-hidden"
    >
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
          <button
            onClick={testVibration}
            className="bg-purple-800 text-purple-200 px-2 py-1 rounded text-xs"
          >
            Test vibration
          </button>
        </div>

        {vibrateResult && (
          <div className="text-[10px] leading-relaxed bg-gray-800 rounded p-2 text-gray-200">
            <p>
              <span className="text-gray-400">supported:</span>{' '}
              <span className={vibrateResult.supported ? 'text-green-300' : 'text-red-300'}>
                {String(vibrateResult.supported)}
              </span>
            </p>
            <p>
              <span className="text-gray-400">navigator.vibrate returned:</span>{' '}
              <span className={vibrateResult.fired ? 'text-green-300' : 'text-red-300'}>
                {String(vibrateResult.fired)}
              </span>
            </p>
            <p className="text-gray-500">tested at {vibrateResult.at}</p>
            {!vibrateResult.supported && (
              <p className="text-yellow-300 mt-1">
                This browser/device has no Vibration API (most likely iOS Safari, desktop Firefox, or a
                desktop browser without a vibration motor).
              </p>
            )}
            {vibrateResult.supported && !vibrateResult.fired && (
              <p className="text-yellow-300 mt-1">
                API exists but vibrate() returned false. Check Battery Saver, Do Not Disturb, or
                Settings → Accessibility → Disable Vibrations.
              </p>
            )}
          </div>
        )}

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
