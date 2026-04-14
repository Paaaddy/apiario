import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function VoiceOverlay({ onStop, lastCommand }) {
  const { t } = useLanguage()

  const COMMANDS = [
    { label: t(s.voice_cmd_season),   desc: t(s.voice_cmd_season_desc) },
    { label: t(s.voice_cmd_diagnose), desc: t(s.voice_cmd_diagnose_desc) },
    { label: t(s.voice_cmd_myhive),   desc: t(s.voice_cmd_myhive_desc) },
    { label: t(s.voice_cmd_next),     desc: t(s.voice_cmd_next_desc) },
    { label: t(s.voice_cmd_read),     desc: t(s.voice_cmd_read_desc) },
    { label: t(s.voice_cmd_stop),     desc: t(s.voice_cmd_stop_desc) },
  ]

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-brown/70" onClick={onStop} />

      <div className="relative z-50 flex flex-col items-center gap-5 px-6 w-full max-w-sm">
        <div className="w-16 h-16 rounded-full bg-honey border-4 border-honey-dark flex items-center justify-center text-3xl animate-pulse-glow shadow-xl">
          🐝
        </div>

        <div className="bg-cream rounded-2xl p-5 w-full shadow-xl">
          <p className="font-serif text-sm font-bold text-brown text-center mb-1">
            {t(s.voice_title)}
          </p>
          <p className="text-brown-mid text-xs text-center mb-4">{t(s.voice_listening)}</p>

          <div className="flex flex-col gap-2">
            {COMMANDS.map(({ label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="bg-honey/20 text-brown font-mono text-xs px-2 py-1 rounded-lg shrink-0">
                  {label}
                </span>
                <span className="text-brown-mid text-xs">{desc}</span>
              </div>
            ))}
          </div>

          {lastCommand && (
            <p className="mt-4 text-center text-xs text-brown-mid italic">
              {t(s.voice_heard)} "{lastCommand}"
            </p>
          )}
        </div>

        <button onClick={onStop} className="text-cream/80 text-sm underline underline-offset-2">
          {t(s.voice_tap_stop)}
        </button>
      </div>
    </div>
  )
}
