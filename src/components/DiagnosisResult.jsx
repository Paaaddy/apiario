import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { themeColors } from '../utils/themeTokens'
import { strings as s } from '../i18n/strings'
import RiskNote from './RiskNote'
import { shareOrCopy } from '../utils/share'
import { haptics } from '../utils/haptics'

export default function DiagnosisResult({ node, onReset }) {
  const { t } = useLanguage()
  const theme = useTheme()?.theme ?? 'a'
  const c = themeColors(theme)
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
      <div style={{ borderRadius: 12, padding: 20, background: node.callExpert ? 'rgba(220,38,38,0.08)' : 'rgba(245,166,35,0.08)', border: `1px solid ${node.callExpert ? 'rgba(220,38,38,0.25)' : c.border}` }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 4, color: c.formInkMid }}>
          {t(s.diagnose_likely)}
        </p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: c.formInk }}>{t(node.diagnosis)}</h2>
        {node.callExpert && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
            <span>⚠️</span>
            <span>{t(s.diagnose_call_expert)}</span>
          </div>
        )}
      </div>

      {node.risk && <RiskNote risk={node.risk} />}

      <div>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: c.formInk, marginBottom: 12 }}>
          {t(s.diagnose_what_to_do)}
        </h3>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
          {node.actions.map((action, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, background: c.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${c.border}` }}>
              <span style={{ color: c.accent, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 14, color: c.formInkMid, lineHeight: 1.6 }}>{t(action)}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={handleShare}
        style={{ width: '100%', border: `1px solid ${c.border}`, color: c.formInkMid, fontWeight: 600, padding: '12px', borderRadius: 12, background: 'transparent', fontSize: 14, cursor: 'pointer' }}
      >
        {shareFeedback === 'copied' ? `✓ ${t(s.share_copied)}` : `📤 ${t(s.share_result)}`}
      </button>

      <button
        onClick={onReset}
        style={{ width: '100%', background: c.accent, color: c.formInk, fontWeight: 600, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
      >
        {t(s.diagnose_restart)}
      </button>
    </div>
  )
}
