import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function VoicePermissionModal({ onRetry, onDismiss }) {
  const { t } = useLanguage()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-perm-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-brown/70" onClick={onDismiss} />

      <div className="relative z-10 w-full max-w-sm bg-cream rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-honey/30 flex items-center justify-center text-xl">
              🎙️
            </div>
            <h2
              id="voice-perm-title"
              className="font-serif text-lg font-bold text-brown"
            >
              {t(s.voice_perm_title)}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="text-brown-mid/70 text-sm"
            aria-label={t(s.voice_perm_dismiss)}
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-brown-mid mt-4 leading-relaxed">
          {t(s.voice_perm_body)}
        </p>
        <p className="text-xs text-brown-mid/80 mt-3 leading-relaxed">
          {t(s.voice_perm_howto)}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          <button
            onClick={onDismiss}
            className="text-brown-mid font-medium rounded-xl px-4 py-2 text-sm"
          >
            {t(s.voice_perm_dismiss)}
          </button>
          <button
            onClick={onRetry}
            className="bg-honey text-brown font-semibold rounded-xl px-4 py-2 text-sm"
          >
            {t(s.voice_perm_retry)}
          </button>
        </div>
      </div>
    </div>
  )
}
