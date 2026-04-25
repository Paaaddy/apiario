import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { useLanguage } from './hooks/useLanguage'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'

const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug')
const VALID_TABS = ['season', 'diagnose', 'myhive']
function initialTab() {
  if (typeof window === 'undefined') return 'season'
  const q = new URLSearchParams(window.location.search).get('tab')
  return VALID_TABS.includes(q) ? q : 'season'
}
import { useProfile } from './hooks/useProfile'
import { useVoice } from './hooks/useVoice'
import { useTaskLog } from './hooks/useTaskLog'
import { usePwaInstallPrompt } from './hooks/usePwaInstallPrompt'
import { useAppBadge } from './hooks/useAppBadge'
import { useSeason } from './hooks/useSeason'
import { useFixedChromeScale } from './hooks/useFixedChromeScale'
import { runWithViewTransition } from './utils/viewTransitions'
import { haptics } from './utils/haptics'
import { requestPersistentStorage } from './utils/persistStorage'

// Locale → voice configuration. Keeping this outside the component
// so the arrays don't get recreated on every render.
const VOICE_CONFIG = {
  de: {
    lang: 'de-DE',
    greeting:
      'Freisprechmodus aktiv. Sage: Diagnose, Saison, Stock, weiter oder stop.',
    bye: 'Freisprechmodus beendet.',
    commands: {
      stop:     ['stop', 'stopp', 'beenden', 'ende', 'aus'],
      diagnose: ['diagnose', 'diagnostizieren', 'problem'],
      season:   ['saison', 'woche', 'aufgaben'],
      myhive:   ['mein stock', 'stock', 'profil', 'verlauf'],
      next:     ['weiter', 'nächste', 'nächster'],
      repeat:   ['nochmal', 'wiederholen', 'wiederhole', 'lesen', 'lies'],
    },
    speech: {
      openDiagnose: 'Diagnose wird geöffnet.',
      openSeason:   'Saison wird geöffnet.',
      openMyHive:   'Mein Stock wird geöffnet.',
      next:         'Weiter.',
      repeat:       'Wiederhole.',
      unknown:      'Nicht verstanden. Versuche: Diagnose, Saison oder Stock.',
    },
  },
  en: {
    lang: 'en-GB',
    greeting:
      'Hands-free mode active. Say: diagnose, season, my hive, next, or stop.',
    bye: 'Hands-free mode ended.',
    commands: {
      stop:     ['stop', 'exit', 'quit', 'end'],
      diagnose: ['diagnose', 'diagnosis', 'problem'],
      season:   ['season', 'tasks', 'week'],
      myhive:   ['my hive', 'hive', 'profile', 'log', 'history'],
      next:     ['next', 'forward'],
      repeat:   ['read', 'repeat', 'again'],
    },
    speech: {
      openDiagnose: 'Opening diagnose.',
      openSeason:   'Opening season.',
      openMyHive:   'Opening my hive.',
      next:         'Next.',
      repeat:       'Repeating.',
      unknown:      "Didn't catch that. Try diagnose, season, or my hive.",
    },
  },
}

function matchCommand(transcript, commandMap) {
  const lower = (transcript ?? '').toLowerCase()
  for (const [action, phrases] of Object.entries(commandMap)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) return action
    }
  }
  return null
}

import BottomNav from './components/BottomNav'
import BeeFab from './components/BeeFab'
import VoiceOverlay from './components/VoiceOverlay'
import VoicePermissionModal from './components/VoicePermissionModal'
import PwaInstallHint from './components/PwaInstallHint'
const Onboarding = lazy(() => import('./screens/Onboarding'))
const SeasonScreen = lazy(() => import('./screens/SeasonScreen'))
const DiagnoseScreen = lazy(() => import('./screens/DiagnoseScreen'))
const MyHiveScreen = lazy(() => import('./screens/MyHiveScreen'))

function AppContent() {
  // Track pinch / browser / OS zoom and expose --app-zoom + --vv-* on
  // :root. Mounted before the onboarding early return so chrome stays
  // counter-scaled during onboarding too.
  useFixedChromeScale()

  const { locale } = useLanguage()
  const { profile, updateProfile, addColony, updateColony, removeColony } = useProfile()
  const { log, completedTaskIds, toggleTask, addCustomEntry, deleteEntry } = useTaskLog()
  const [activeTab, setActiveTabState] = useState(initialTab)

  // Wrap tab changes in the View Transitions API when available so
  // the user sees a native-feeling cross-fade between Season / Diagnose
  // / My Hive instead of a hard swap. Also gives a small haptic tap
  // on the tab change.
  const setActiveTab = useCallback((next) => {
    haptics.tap()
    runWithViewTransition(() => setActiveTabState(next))
  }, [])

  // Surface the number of outstanding urgent/important tasks on the
  // installed app icon — the beekeeper sees "3" on the home screen
  // without opening the app.
  const seasonForBadge = useSeason(profile)
  const pendingUrgentCount = useMemo(() => {
    const tasks = seasonForBadge.tasks ?? []
    return tasks.filter(
      (t) =>
        (t.urgency === 'urgent' || t.urgency === 'important') &&
        !completedTaskIds.has(t.id)
    ).length
  }, [seasonForBadge.tasks, completedTaskIds])
  useAppBadge(pendingUrgentCount)

  // Once the user has completed onboarding they have data worth
  // protecting (profile, colonies, log). Ask the browser to upgrade
  // this origin to persistent storage so Chrome / Firefox stop
  // considering the localStorage + IndexedDB eligible for eviction
  // under pressure. Silently no-ops on unsupported browsers.
  useEffect(() => {
    if (profile?.onboardingDone) {
      requestPersistentStorage().catch(() => {})
    }
  }, [profile?.onboardingDone])

  const [voiceActive, setVoiceActive] = useState(false)
  const [lastCommand, setLastCommand] = useState('')
  const [voicePermissionBlocked, setVoicePermissionBlocked] = useState(false)
  const { speak, stopSpeaking, startListening, stopListening } = useVoice()
  const pwaInstall = usePwaInstallPrompt()

  const handleVoiceStop = useCallback(() => {
    setVoiceActive(false)
    setLastCommand('')
    stopSpeaking()
    stopListening()
  }, [stopSpeaking, stopListening])

  const handleVoiceStopRef = useRef(handleVoiceStop)
  useEffect(() => { handleVoiceStopRef.current = handleVoiceStop }, [handleVoiceStop])

  const handleVoiceActivate = useCallback(() => {
    if (voiceActive) return
    const config = VOICE_CONFIG[locale] ?? VOICE_CONFIG.en
    setVoiceActive(true)
    speak(config.greeting, { lang: config.lang })
    startListening(
      (transcript) => {
        setLastCommand(transcript)
        const action = matchCommand(transcript, config.commands)
        switch (action) {
          case 'stop':
            speak(config.bye, { lang: config.lang })
            handleVoiceStopRef.current()
            break
          case 'diagnose':
            speak(config.speech.openDiagnose, { lang: config.lang })
            setActiveTab('diagnose')
            break
          case 'season':
            speak(config.speech.openSeason, { lang: config.lang })
            setActiveTab('season')
            break
          case 'myhive':
            speak(config.speech.openMyHive, { lang: config.lang })
            setActiveTab('myhive')
            break
          case 'next':
            speak(config.speech.next, { lang: config.lang })
            break
          case 'repeat':
            speak(config.speech.repeat, { lang: config.lang })
            break
          default:
            speak(config.speech.unknown, { lang: config.lang })
        }
      },
      (error) => {
        handleVoiceStopRef.current()
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          setVoicePermissionBlocked(true)
        }
      },
      { lang: config.lang }
    )
  }, [voiceActive, locale, speak, startListening, setActiveTab])

  const handleVoicePermissionRetry = useCallback(() => {
    setVoicePermissionBlocked(false)
    // Defer to the next tick so the modal unmounts before we re-request.
    // Some browsers ignore a fresh permission request if the previous one
    // is still considered "in-flight".
    setTimeout(() => handleVoiceActivate(), 0)
  }, [handleVoiceActivate])

  if (!profile.onboardingDone) {
    return (
      <div className="flex flex-col h-full bg-cream">
        <Suspense fallback={<div className="flex-1" />}>
          <Onboarding
            onComplete={(answers) => updateProfile({ ...answers, onboardingDone: true })}
            pwaInstall={pwaInstall}
          />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-cream">
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex-1" />}>
          {activeTab === 'season' && (
            <SeasonScreen
              profile={profile}
              log={log}
              completedTaskIds={completedTaskIds}
              onToggleTask={toggleTask}
            />
          )}
          {activeTab === 'diagnose' && <DiagnoseScreen />}
          {activeTab === 'myhive' && (
            <MyHiveScreen
              profile={profile}
              onUpdate={updateProfile}
              log={log}
              onAddEntry={addCustomEntry}
              onDeleteEntry={deleteEntry}
              onAddColony={addColony}
              onUpdateColony={updateColony}
              onRemoveColony={removeColony}
              pwaInstall={pwaInstall}
            />
          )}
        </Suspense>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <BeeFab onActivate={handleVoiceActivate} isActive={voiceActive} />
      <PwaInstallHint
        isInstalled={pwaInstall.isInstalled}
        installSupported={pwaInstall.installSupported}
        onInstall={pwaInstall.promptInstall}
        compact
        dismissible
        floating
      />
      {voiceActive && <VoiceOverlay onStop={handleVoiceStop} lastCommand={lastCommand} />}
      {voicePermissionBlocked && (
        <VoicePermissionModal
          onRetry={handleVoicePermissionRetry}
          onDismiss={() => setVoicePermissionBlocked(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
        {DEBUG && <DebugPanel />}
      </LanguageProvider>
    </ThemeProvider>
  )
}
