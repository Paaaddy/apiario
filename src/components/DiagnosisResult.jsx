import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import RiskNote from './RiskNote'
import { shareOrCopy } from '../utils/share'
import { haptics } from '../utils/haptics'

export default function DiagnosisResult({ node, onReset }) {
  const { t } = useLanguage()
  const [shareFeedback, setShareFeedback] = useState(null)
  const feedbackTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current) }
  }, [])

  async function handleShare() {
    try {
      const title = `🐝 Apiario — ${t(node.diagnosis)}`
      const lines = [t(node.diagnosis)]
      if (node.callExpert) lines.push(`⚠️ ${t(s.diagnose_call_expert)}`)
      lines.push('')
      lines.push(t(s.diagnose_what_to_do) + ':')
      node.actions.forEach((action, i) => {
        lines.push(`${i + 1}. ${t(action)}`)
      })

      const result = await shareOrCopy({
        title,
        text: lines.join('\n'),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      })
      if (result.status === 'shared') {
        haptics.success()
      } else if (result.status === 'copied') {
        haptics.tap()
        setShareFeedback('copied')
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
        feedbackTimerRef.current = setTimeout(() => setShareFeedback(null), 2500)
      }
    } catch {
      // User dismissed share sheet or share unsupported — no action needed
    }
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <div className={`rounded-xl p-5 ${node.callExpert ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
        <p className="text-xs uppercase tracking-widest font-medium mb-1 text-brown-mid">
          {t(s.diagnose_likely)}
        </p>
        <h2 className="font-serif text-lg font-bold text-brown">{t(node.diagnosis)}</h2>
        {node.callExpert && (
          <div className="mt-2 flex items-center gap-2 text-red-700 text-sm font-medium">
            <span>⚠️</span>
            <span>{t(s.diagnose_call_expert)}</span>
          </div>
        )}
      </div>

      {node.risk && <RiskNote risk={node.risk} />}

      <div>
        <h3 className="font-serif text-base font-semibold text-brown mb-3">
          {t(s.diagnose_what_to_do)}
        </h3>
        <ol className="flex flex-col gap-2">
          {node.actions.map((action, i) => (
            <li key={i} className="flex gap-3 bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
              <span className="text-honey font-bold text-sm shrink-0">{i + 1}.</span>
              <span className="text-sm text-brown-mid leading-relaxed">{t(action)}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="w-full border border-amber-200 text-brown-mid font-semibold py-3 rounded-xl active:bg-amber-50 transition-colors text-sm"
      >
        {shareFeedback === 'copied' ? `✓ ${t(s.share_copied)}` : `📤 ${t(s.share_result)}`}
      </button>

      <button
        onClick={onReset}
        className="w-full bg-honey text-brown font-semibold py-3 rounded-xl active:bg-honey-dark transition-colors"
      >
        {t(s.diagnose_restart)}
      </button>
    </div>
  )
}
