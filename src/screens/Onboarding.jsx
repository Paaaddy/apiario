import { useRef } from 'react'
import { OnboardingProvider, useOnboarding } from '@onboardjs/react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import LanguageToggle from '../components/LanguageToggle'
import HexWatermark from '../components/HexWatermark'

// ── Step: Welcome ────────────────────────────────────────────────────────────

function WelcomeStep() {
  const { t } = useLanguage()
  const { next } = useOnboarding()
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
            <p className="text-brown-light mt-1 text-sm">{t(s.onboarding_subtitle)}</p>
          </div>
          <LanguageToggle />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="text-8xl mb-10 animate-bob">🐝</div>
        <button
          onClick={() => next()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-sm active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_lets_go)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Features overview ───────────────────────────────────────────────────

function FeaturesStep() {
  const { t } = useLanguage()
  const { next } = useOnboarding()
  const features = [
    { icon: '🌱', label: t(s.nav_season),   desc: t(s.onboarding_feature_season_desc)  },
    { icon: '🔎', label: t(s.nav_diagnose), desc: t(s.onboarding_feature_diagnose_desc) },
    { icon: '🐝', label: t(s.nav_myhive),   desc: t(s.onboarding_feature_myhive_desc)  },
  ]
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
          </div>
          <LanguageToggle />
        </div>
      </div>
      <div className="px-6 pt-6 flex flex-col gap-4">
        {features.map(({ icon, label, desc }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-5 py-4 border border-amber-100 shadow-sm flex items-start gap-4"
          >
            <span className="text-3xl mt-0.5">{icon}</span>
            <div>
              <p className="font-semibold text-brown">{label}</p>
              <p className="text-sm text-brown-mid mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 pt-6 pb-10">
        <button
          onClick={() => next()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-sm active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Question (reused for hiveCount, climateZone, experience) ────────────

function QuestionStep({ payload, onDataChange }) {
  const { t } = useLanguage()
  const { next } = useOnboarding()

  function handleSelect(value) {
    payload.onAnswer(payload.answerKey, value)
    onDataChange({ [payload.answerKey]: value }, true)
    next()
  }

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="flex gap-2 px-6 pt-6">
        {payload.dots.map((active, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${active ? 'bg-honey w-6' : 'bg-amber-200 w-2'}`}
          />
        ))}
      </div>

      <div className="px-6 pt-6 pb-4">
        <h2 className="font-serif text-xl text-brown font-semibold">{t(payload.question)}</h2>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {payload.options.map(({ label, value }) => (
          <button
            key={String(value)}
            onClick={() => handleSelect(value)}
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown font-medium shadow-sm active:bg-amber-50 transition-colors"
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step: Complete ────────────────────────────────────────────────────────────

function CompleteStep({ payload }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-5xl mb-3">🍯</div>
            <h1 className="font-serif text-3xl font-bold text-brown">{t(s.onboarding_title)}</h1>
          </div>
          <LanguageToggle />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-serif text-2xl font-bold text-brown mb-2">
          {t(s.onboarding_complete_title)}
        </h2>
        <p className="text-brown-mid text-sm mb-10">{t(s.onboarding_subtitle)}</p>
        <button
          onClick={payload.onFinish}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-sm active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Component registry ────────────────────────────────────────────────────────

const COMPONENT_REGISTRY = {
  welcome:  WelcomeStep,
  features: FeaturesStep,
  question: QuestionStep,
  complete: CompleteStep,
}

// ── Inner UI (must live inside OnboardingProvider) ────────────────────────────

function OnboardingUI() {
  const { renderStep, state } = useOnboarding()
  if (!state || !state.currentStep) return null
  return <>{renderStep()}</>
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const answersRef = useRef({})

  // Stable ref so the steps array (created once) can call the latest onComplete
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Steps are created once on first render and stored in a ref to keep them
  // stable (OnboardingProvider re-initialises if the steps array reference changes).
  const stepsRef = useRef(null)
  if (!stepsRef.current) {
    const onAnswer = (key, value) => {
      answersRef.current = { ...answersRef.current, [key]: value }
    }

    stepsRef.current = [
      {
        id: 'welcome',
        type: 'CUSTOM_COMPONENT',
        payload: { componentKey: 'welcome' },
        nextStep: 'features',
      },
      {
        id: 'features',
        type: 'CUSTOM_COMPONENT',
        payload: { componentKey: 'features' },
        nextStep: 'hiveCount',
      },
      {
        id: 'hiveCount',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'question',
          answerKey: 'hiveCount',
          question: s.onboarding_q_hives,
          dots: [true, false, false],
          options: [
            { label: s.hive_1,  value: 1  },
            { label: s.hive_2,  value: 2  },
            { label: s.hive_5,  value: 5  },
            { label: s.hive_10, value: 10 },
          ],
          onAnswer,
        },
        nextStep: 'climateZone',
      },
      {
        id: 'climateZone',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'question',
          answerKey: 'climateZone',
          question: s.onboarding_q_zone,
          dots: [true, true, false],
          options: [
            { label: s.zone_northern,      value: 'northern'      },
            { label: s.zone_central,       value: 'central'       },
            { label: s.zone_mediterranean, value: 'mediterranean' },
            { label: s.zone_other,         value: 'other'         },
          ],
          onAnswer,
        },
        nextStep: 'experience',
      },
      {
        id: 'experience',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'question',
          answerKey: 'experience',
          question: s.onboarding_q_exp,
          dots: [true, true, true],
          options: [
            { label: s.exp_0, value: 0 },
            { label: s.exp_1, value: 1 },
            { label: s.exp_2, value: 2 },
          ],
          onAnswer,
        },
        nextStep: 'complete',
      },
      {
        id: 'complete',
        type: 'CUSTOM_COMPONENT',
        payload: {
          componentKey: 'complete',
          onFinish: () => onCompleteRef.current(answersRef.current),
        },
        nextStep: null,
      },
    ]
  }

  return (
    <OnboardingProvider steps={stepsRef.current} componentRegistry={COMPONENT_REGISTRY}>
      <OnboardingUI />
    </OnboardingProvider>
  )
}
