import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function PwaInstallHint({
  isInstalled,
  installSupported,
  onInstall,
  compact = false,
  dismissible = false,
}) {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  if (isInstalled || dismissed) return null

  return (
    <section className={`bg-white border border-amber-200 rounded-2xl shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-brown-mid/70 font-semibold">{t(s.pwa_badge)}</p>
          <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-brown mt-1`}>
            {t(s.pwa_title)}
          </h3>
          <p className="text-sm text-brown-mid mt-1 leading-relaxed">{t(s.pwa_body)}</p>
          {!installSupported && (
            <p className="text-xs text-brown-mid/80 mt-2 leading-relaxed">
              {t(s.pwa_manual_hint)}
            </p>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-brown-mid/70 text-sm"
            aria-label={t(s.pwa_dismiss)}
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {installSupported && (
          <button
            onClick={onInstall}
            className="bg-honey text-brown font-semibold rounded-xl px-4 py-2 text-sm"
          >
            {t(s.pwa_install_cta)}
          </button>
        )}
        <span className="text-xs text-brown-mid/80 self-center">{t(s.pwa_later_hint)}</span>
      </div>
    </section>
  )
}
