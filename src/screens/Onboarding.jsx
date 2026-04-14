import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import LanguageToggle from '../components/LanguageToggle'
import PwaInstallHint from '../components/PwaInstallHint'

export default function Onboarding({ onComplete, pwaInstall = { isInstalled: true, installSupported: false, promptInstall: () => {} } }) {
  const { t } = useLanguage()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const STEPS = [
    {
      key: 'hiveCount',
      question: s.onboarding_q_hives,
      options: [
        { label: s.hive_1, value: 1 },
        { label: s.hive_2, value: 2 },
        { label: s.hive_5, value: 5 },
        { label: s.hive_10, value: 10 },
      ],
    },
    {
      key: 'climateZone',
      question: s.onboarding_q_zone,
      options: [
        { label: s.zone_northern,      value: 'northern'      },
        { label: s.zone_central,       value: 'central'       },
        { label: s.zone_mediterranean, value: 'mediterranean' },
        { label: s.zone_other,         value: 'other'         },
      ],
    },
    {
      key: 'experience',
      question: s.onboarding_q_exp,
      options: [
        { label: s.exp_0, value: 0 },
        { label: s.exp_1, value: 1 },
        { label: s.exp_2, value: 2 },
      ],
    },
  ]

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
        <div className="flex items-start justify-between">
          <div>
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
            <p className="text-brown-light mt-1 text-sm">{t(s.onboarding_subtitle)}</p>
          </div>
          <LanguageToggle />
        </div>
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
          {t(currentStep.question)}
        </h2>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {currentStep.options.map(({ label, value }) => (
          <button
            key={String(value)}
            onClick={() => handleSelect(value)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown font-medium shadow-sm active:bg-amber-50 transition-colors"
          >
            {t(label)}
          </button>
        ))}
      </div>

      <div className="px-6 pt-6">
        <PwaInstallHint
          isInstalled={pwaInstall.isInstalled}
          installSupported={pwaInstall.installSupported}
          onInstall={pwaInstall.promptInstall}
        />
      </div>

      <div className="mt-auto px-6 py-8">
        <p className="text-center text-xs text-brown-mid/60 leading-relaxed">
          🇮🇹 <em>Apiario</em> —&nbsp;
          {t({
            de: 'Italienisch für „Bienenstand". Ein Ort, an dem Bienen gedeihen — genau wie deine Völker.',
            en: 'Italian for "apiary". A place where bees thrive — just like your colonies.',
          })}
        </p>
      </div>
    </div>
  )
}
