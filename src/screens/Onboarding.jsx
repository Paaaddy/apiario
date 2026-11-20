import { useRef, useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useBackupRestoreController } from '../hooks/useBackupRestoreController'
import { useDraftProtection } from '../hooks/useDraftProtection'
import { strings as s } from '../i18n/strings'
import { HIVE_COUNT_OPTIONS, CLIMATE_ZONE_OPTIONS, EXPERIENCE_OPTIONS } from '../utils/profileAnswers'
import LanguageToggle from '../components/LanguageToggle'
import HexWatermark from '../components/HexWatermark'

// ── Step: Welcome ────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-xs shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
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
          onClick={() => onNext()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-xs active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_lets_go)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Features overview ───────────────────────────────────────────────────

function FeaturesStep({ onNext }) {
  const { t } = useLanguage()
  const features = [
    { icon: '🌱', label: t(s.nav_season),   desc: t(s.onboarding_feature_season_desc)  },
    { icon: '🔎', label: t(s.nav_diagnose), desc: t(s.onboarding_feature_diagnose_desc) },
    { icon: '🐝', label: t(s.nav_myhive),   desc: t(s.onboarding_feature_myhive_desc)  },
  ]
  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-xs shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
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
            className="bg-white rounded-xl px-5 py-4 border border-amber-100 shadow-xs flex items-start gap-4"
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
          onClick={() => onNext()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-xs active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Privacy & Import ────────────────────────────────────────────────────

function PrivacyStep({ onNext }) {
  const { t } = useLanguage()
  const { status, restoreFromInput } = useBackupRestoreController(t)
  const fileInputRef = useRef(null)

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-xs shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
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
        <div className="bg-white rounded-xl px-5 py-4 border border-amber-100 shadow-xs">
          <h2 className="font-semibold text-brown mb-2">{t(s.privacy_title)}</h2>
          <p className="text-sm text-brown-mid">{t(s.onboarding_privacy_step_body)}</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-4 border border-amber-100 shadow-xs">
          <p className="text-sm text-brown-mid mb-3">{t(s.onboarding_privacy_import_prompt)}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left bg-honey text-brown font-medium py-2 px-3 rounded-lg active:opacity-80 transition-opacity text-sm"
          >
            {t(s.data_import)}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={restoreFromInput}
          />
          {status && (
            <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: status.kind === 'error' ? '#d33' : '#92400e' }}>
              {status.message}
            </p>
          )}
        </div>
      </div>
      <div className="px-6 pt-6 pb-10">
        <button
          onClick={() => onNext()}
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-xs active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Step: Question (reused for hiveCount, climateZone, experience) ────────────

function QuestionStep({ payload, onNext }) {
  const { t } = useLanguage()

  function handleSelect(value) {
    payload.onAnswer(payload.answerKey, value)
    onNext()
  }

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-xs shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
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
            className="w-full text-left bg-white rounded-xl px-5 py-4 border border-amber-100 text-brown font-medium shadow-xs active:bg-amber-50 transition-colors"
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
      <div className="bg-honey px-6 pt-12 pb-8 border-b border-honey-dark/20 shadow-xs shadow-honey-dark/20" style={{ position: 'relative', overflow: 'hidden' }}>
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
          className="w-full bg-honey text-brown font-bold py-4 rounded-xl text-lg shadow-xs active:opacity-80 transition-opacity"
        >
          {t(s.onboarding_continue)}
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState('welcome')
  const answersRef = useRef({})
  const { markDraft, clearDraft } = useDraftProtection()

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const onAnswer = (key, value) => {
    markDraft()
    answersRef.current = { ...answersRef.current, [key]: value }
  }
  const onFinish = () => {
    onCompleteRef.current(answersRef.current)
    clearDraft()
  }

  const next = () => {
    const order = ['welcome', 'features', 'privacy', 'hiveCount', 'climateZone', 'experience', 'complete']
    setStep((prev) => {
      const i = order.indexOf(prev)
      return i >= 0 && i < order.length - 1 ? order[i + 1] : prev
    })
  }

  const hivePayload = {
    answerKey: 'hiveCount',
    question: s.onboarding_q_hives,
    dots: [true, false, false],
    options: HIVE_COUNT_OPTIONS,
    onAnswer,
  }
  const climatePayload = {
    answerKey: 'climateZone',
    question: s.onboarding_q_zone,
    dots: [true, true, false],
    options: CLIMATE_ZONE_OPTIONS,
    onAnswer,
  }
  const experiencePayload = {
    answerKey: 'experience',
    question: s.onboarding_q_exp,
    dots: [true, true, true],
    options: EXPERIENCE_OPTIONS,
    onAnswer,
  }
  const completePayload = { onFinish }

  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={next} />
    case 'features':
      return <FeaturesStep onNext={next} />
    case 'privacy':
      return <PrivacyStep onNext={next} />
    case 'hiveCount':
      return <QuestionStep payload={hivePayload} onNext={next} />
    case 'climateZone':
      return <QuestionStep payload={climatePayload} onNext={next} />
    case 'experience':
      return <QuestionStep payload={experiencePayload} onNext={next} />
    case 'complete':
      return <CompleteStep payload={completePayload} />
    default:
      return null
  }
}
