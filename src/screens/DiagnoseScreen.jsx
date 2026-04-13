import { useState } from 'react'
import diagnosisData from '../data/diagnosis.json'
import DiagnosisResult from '../components/DiagnosisResult'

export default function DiagnoseScreen() {
  const [currentNodeId, setCurrentNodeId] = useState('root')
  const [history, setHistory] = useState([])

  const node = diagnosisData[currentNodeId]

  function handleSelect(nextId) {
    setHistory((prev) => [...prev, currentNodeId])
    setCurrentNodeId(nextId)
  }

  function handleReset() {
    setHistory([])
    setCurrentNodeId('root')
  }

  if (!node) return null

  if (node.type === 'outcome') {
    return (
      <div className="flex flex-col min-h-full">
        <div className="bg-honey px-6 pt-10 pb-6">
          <h1 className="font-serif text-2xl font-bold text-brown">🔎 Diagnosis</h1>
        </div>
        <DiagnosisResult node={node} onReset={handleReset} />
      </div>
    )
  }

  const stepNumber = history.length + 1

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6">
        <h1 className="font-serif text-2xl font-bold text-brown">🔎 Diagnose</h1>
        <p className="text-brown-light text-sm mt-1">Step {stepNumber}</p>
      </div>

      <div className="h-1 bg-amber-100">
        <div
          className="h-1 bg-honey transition-all"
          style={{ width: `${Math.min((stepNumber / 6) * 100, 95)}%` }}
        />
      </div>

      <div className="px-4 pt-6 pb-3">
        <h2 className="font-serif text-lg font-semibold text-brown">{node.question}</h2>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {node.options.map((option) => (
          <button
            key={option.next}
            onClick={() => handleSelect(option.next)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown text-sm font-medium shadow-sm active:bg-amber-50 transition-colors leading-snug"
          >
            {option.label}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div className="px-4 mt-4">
          <button onClick={handleReset} className="text-sm text-brown-mid underline underline-offset-2">
            Start over
          </button>
        </div>
      )}
    </div>
  )
}
