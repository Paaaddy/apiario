import { useState } from 'react'

const STEPS = [
  {
    key: 'hiveCount',
    question: 'How many hives do you keep?',
    options: [
      { label: '1 hive', value: 1 },
      { label: '2–3 hives', value: 2 },
      { label: '4–9 hives', value: 5 },
      { label: '10 or more', value: 10 },
    ],
  },
  {
    key: 'climateZone',
    question: 'Where are you located?',
    options: [
      { label: 'Northern Europe', value: 'northern' },
      { label: 'Central Europe', value: 'central' },
      { label: 'Mediterranean', value: 'mediterranean' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    key: 'experience',
    question: 'How long have you been keeping bees?',
    options: [
      { label: 'First year', value: 0 },
      { label: '1–3 seasons', value: 1 },
      { label: 'Experienced (4+ years)', value: 2 },
    ],
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})

  function handleSelect(value) {
    const nextAnswers = { ...answers, [STEPS[step].key]: value }
    if (step < STEPS.length - 1) {
      setAnswers(nextAnswers)
      setStep(step + 1)
    } else {
      onComplete(nextAnswers)
    }
  }

  const currentStep = STEPS[step]

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8">
        <div className="text-5xl mb-3">🍯</div>
        <h1 className="font-serif text-3xl font-bold text-brown">Apiario</h1>
        <p className="text-brown-light mt-1 text-sm">Your beekeeping companion</p>
      </div>

      <div className="flex gap-2 px-6 pt-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i <= step ? 'bg-honey w-6' : 'bg-amber-200 w-2'
            }`}
          />
        ))}
      </div>

      <div className="px-6 pt-6 pb-4">
        <h2 className="font-serif text-xl text-brown font-semibold">
          {currentStep.question}
        </h2>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {currentStep.options.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => handleSelect(value)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown font-medium shadow-sm active:bg-amber-50 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
