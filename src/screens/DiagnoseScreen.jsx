import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { validateDiagnosisTree } from '../utils/validateDiagnosis'
import { strings as s } from '../i18n/strings'
import diagnosisData from '../data/diagnosis.json'
import DiagnosisResult from '../components/DiagnosisResult'
import LanguageToggle from '../components/LanguageToggle'
import { useWakeLock } from '../hooks/useWakeLock'
import { haptics } from '../utils/haptics'

export default function DiagnoseScreen() {
  const { t } = useLanguage()
  const [currentNodeId, setCurrentNodeId] = useState('root')
  const [history, setHistory] = useState([])

  // Keep the screen awake for the duration of the diagnose wizard —
  // the user is usually outdoors with their phone in hand, reading
  // longer text blocks, and auto-lock mid-diagnosis is very annoying.
  useWakeLock(true)

  useEffect(() => { validateDiagnosisTree() }, [])

  const node = diagnosisData[currentNodeId]

  function handleSelect(nextId) {
    haptics.tap()
    setHistory((prev) => [...prev, currentNodeId])
    setCurrentNodeId(nextId)
  }

  function handleReset() {
    haptics.tap()
    setHistory([])
    setCurrentNodeId('root')
  }

  if (!node) return null

  if (node.type === 'outcome') {
    return (
      <div className="flex flex-col min-h-full">
        <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-serif text-2xl font-bold text-brown">🔎 {t(s.diagnose_title)}</h1>
            <LanguageToggle />
          </div>
        </div>
        <DiagnosisResult node={node} onReset={handleReset} />
      </div>
    )
  }

  const stepNumber = history.length + 1

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold text-brown">🔎 {t(s.diagnose_title)}</h1>
            <p className="text-brown-light text-sm mt-1">{t(s.diagnose_step)} {stepNumber}</p>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="h-1 bg-amber-100">
        <div
          className="h-1 bg-honey transition-all"
          style={{ width: `${Math.min((stepNumber / 6) * 100, 95)}%` }}
        />
      </div>

      <div className="px-4 pt-6 pb-3">
        <h2 className="font-serif text-lg font-semibold text-brown">{t(node.question)}</h2>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {node.options.map((option) => (
          <button
            key={option.next}
            onClick={() => handleSelect(option.next)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown text-sm font-medium shadow-sm active:bg-amber-50 transition-colors leading-snug"
          >
            {t(option.label)}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button onClick={handleReset} className="text-sm text-brown-mid underline underline-offset-2">
          {t(s.diagnose_restart)}
        </button>
      </div>
    </div>
  )
}
