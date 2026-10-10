import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

export default function VoiceNotice({ feedback, onRestart, onDismiss }) {
  const { t } = useLanguage()
  if (!feedback) return null
  return (
    <div role="status" className="shrink-0 border-b border-honey-dark bg-cream p-3 text-brown">
      <p className="text-sm font-semibold">{t(s[`voice_${feedback}`])}</p>
      <button type="button" onClick={onRestart} className="mt-2 rounded-lg bg-honey px-3 py-2 font-semibold text-brown">{t(s.voice_restart)}</button>
      <button type="button" onClick={onDismiss} className="ml-3 text-sm underline">{t(s.voice_perm_dismiss)}</button>
    </div>
  )
}
