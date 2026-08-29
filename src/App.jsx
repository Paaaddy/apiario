import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { useLanguage } from './hooks/useLanguage'
import { useProfile, buildSeededColonies } from './hooks/useProfile'
import { useVoice } from './hooks/useVoice'
import { useTaskLog } from './hooks/useTaskLog'
import { useInspections } from './hooks/useInspections'
import { usePwaInstallPrompt } from './hooks/usePwaInstallPrompt'
import { useAppBadge } from './hooks/useAppBadge'
import { useSeason } from './hooks/useSeason'
import { runWithViewTransition } from './utils/viewTransitions'
import { haptics } from './utils/haptics'
import { requestPersistentStorage } from './utils/persistStorage'
import { VOICE_CONFIG, dispatchVoiceCommand } from './utils/voiceCommands'
import ErrorBoundary from './components/ErrorBoundary'
import BottomNav from './components/BottomNav'
import BeeFab from './components/BeeFab'
import VoiceOverlay from './components/VoiceOverlay'
import VoicePermissionModal from './components/VoicePermissionModal'
import PwaInstallHint from './components/PwaInstallHint'
import DebugPanel from './components/DebugPanel'

const Onboarding    = lazy(() => import('./screens/Onboarding'))
const SeasonScreen  = lazy(() => import('./screens/SeasonScreen'))
const DiagnoseScreen = lazy(() => import('./screens/DiagnoseScreen'))
const InspectScreen = lazy(() => import('./screens/InspectScreen'))
const MyHiveScreen  = lazy(() => import('./screens/MyHiveScreen'))

const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug')
const VALID_TABS = ['season', 'diagnose', 'inspect', 'myhive']
function initialTab() {
  const q = new URLSearchParams(window.location.search).get('tab')
  return VALID_TABS.includes(q) ? q : 'season'
}

function AppContent() {
  const { locale } = useLanguage()
  const { profile, updateProfile, addColony, updateColony, removeColony } = useProfile()
  const { log, completedTaskIds, toggleTask, addCustomEntry, deleteEntry } = useTaskLog()
  const { inspections, addInspection, updateInspection, removeInspection, removeInspectionsByColonyId } = useInspections()

  const handleRemoveColony = useCallback((colonyId) => {
    removeInspectionsByColonyId(colonyId)
    removeColony(colonyId)
  }, [removeColony, removeInspectionsByColonyId])
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
        const { action, spokenText } = dispatchVoiceCommand(transcript, locale)
        speak(spokenText, { lang: config.lang })
        if (action === 'stop') {
          handleVoiceStopRef.current()
        } else if (action) {
          setActiveTab(action)
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
            onComplete={(answers) => {
              const updates = { ...answers, onboardingDone: true }
              if ((profile.colonies ?? []).length === 0 && Number(answers.hiveCount) > 0) {
                updates.colonies = buildSeededColonies(answers.hiveCount)
              }
              updateProfile(updates)
            }}
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
          {activeTab === 'diagnose' && <DiagnoseScreen inspections={inspections} />}
          {activeTab === 'inspect' && (
            <InspectScreen
              colonies={profile?.colonies ?? []}
              inspections={inspections}
              onAdd={addInspection}
              onUpdate={updateInspection}
              onDelete={removeInspection}
            />
          )}
          {activeTab === 'myhive' && (
            <MyHiveScreen
              profile={profile}
              onUpdate={updateProfile}
              log={log}
              onAddEntry={addCustomEntry}
              onDeleteEntry={deleteEntry}
              onAddColony={addColony}
              onUpdateColony={updateColony}
              onRemoveColony={handleRemoveColony}
              inspections={inspections}
              onAddInspection={addInspection}
              onUpdateInspection={updateInspection}
              onDeleteInspection={removeInspection}
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
