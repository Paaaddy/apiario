import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { useLanguage } from './hooks/useLanguage'
import { useProfile, buildSeededColonies } from './hooks/useProfile'
import { useTaskLog } from './hooks/useTaskLog'
import { useInspections } from './hooks/useInspections'
import { usePwaInstallPrompt } from './hooks/usePwaInstallPrompt'
import { useAppBadge } from './hooks/useAppBadge'
import { useSeason } from './hooks/useSeason'
import { useCurrentDate } from './hooks/useCurrentDate'
import { useHandsFreeSession } from './hooks/useHandsFreeSession'
import { useColonyRemoval } from './hooks/useColonyRemoval'
import { strings as s } from './i18n/strings'
import UpdateNotice from './components/UpdateNotice'
import VoiceNotice from './components/VoiceNotice'
import { runWithViewTransition } from './utils/viewTransitions'
import { haptics } from './utils/haptics'
import { requestPersistentStorage } from './utils/persistStorage'
import NextActionNotice from './components/NextActionNotice'
import StorageNotice from './components/StorageNotice'
import BackupRecoveryNotice from './components/BackupRecoveryNotice'
import HostingMigrationNotice from './components/HostingMigrationNotice'
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
const LearnScreen   = lazy(() => import('./screens/LearnScreen'))

const DEBUG = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug')
const VALID_TABS = ['season', 'diagnose', 'inspect', 'learn', 'myhive']
function initialTab() {
  const q = new URLSearchParams(window.location.search).get('tab')
  return VALID_TABS.includes(q) ? q : 'season'
}

function AppContent() {
  const { locale, t } = useLanguage()
  const { profile, updateProfile, addColony, updateColony, removeColony, persistenceError: profileError, retrySave: retryProfile } = useProfile()
  const { log, completedTaskIds, toggleTask, addCustomEntry, deleteEntry, persistenceError: logError, retrySave: retryLog } = useTaskLog()
  const { inspections, addInspection, updateInspection, removeInspection, removeInspectionsByColonyId, persistenceError: inspectionError, retrySave: retryInspections } = useInspections()
  const storageNotice = (profileError || logError || inspectionError) && (
    <StorageNotice error={profileError || logError || inspectionError} onRetry={() => {
      if (profileError) retryProfile()
      if (logError) retryLog()
      if (inspectionError) retryInspections()
    }} />
  )

  const colonyRemoval = useColonyRemoval(removeColony, removeInspectionsByColonyId)
  const [activeTab, setActiveTabState] = useState(initialTab)
  const [nextAction, setNextAction] = useState(null)
  const actionSequence = useRef(0)
  const targetColonyExists = !nextAction?.colonyId || profile.colonies.some((colony) => colony.id === nextAction.colonyId)

  // Wrap tab changes in the View Transitions API when available so
  // the user sees a native-feeling cross-fade between Season / Diagnose
  // / My Hive instead of a hard swap. Also gives a small haptic tap
  // on the tab change.
  const setActiveTab = useCallback((next, action = null) => {
    haptics.tap()
    runWithViewTransition(() => {
      setNextAction(action)
      setActiveTabState(next)
    })
  }, [])

  const handleNextAction = useCallback((target) => {
    if (target?.tab && VALID_TABS.includes(target.tab)) {
      setActiveTab(target.tab, { ...target, selectionId: ++actionSequence.current })
    }
  }, [setActiveTab])

  // Surface the number of outstanding urgent/important tasks on the
  // installed app icon — the beekeeper sees "3" on the home screen
  // without opening the app.
  const today = useCurrentDate()
  const seasonForBadge = useSeason(profile, completedTaskIds.size, today)
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

  const handsFree = useHandsFreeSession(locale, setActiveTab)
  const pwaInstall = usePwaInstallPrompt()

  if (!profile.onboardingDone) {
    return (
      <div className="flex flex-col h-full bg-cream">
        <HostingMigrationNotice />
        <BackupRecoveryNotice />
        <UpdateNotice />
        {storageNotice}
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
      <HostingMigrationNotice />
      <BackupRecoveryNotice />
      {storageNotice}
      <UpdateNotice />
      {colonyRemoval.pendingColonyId && (
        <div role="alert" className="shrink-0 border-b border-honey-dark bg-cream p-3 text-brown">
          <p className="text-sm font-semibold">{t(s.colony_delete_failed)}</p>
          <button type="button" onClick={colonyRemoval.retry} className="mt-2 rounded-lg bg-honey px-3 py-2 font-semibold text-brown">{t(s.colony_delete_retry)}</button>
        </div>
      )}
      <VoiceNotice feedback={handsFree.feedback} onRestart={handsFree.start} onDismiss={handsFree.dismissFeedback} />
      <main className="flex-1 overflow-y-auto">
        {!targetColonyExists && <NextActionNotice key={nextAction.selectionId} />}
        <Suspense fallback={<div className="flex-1" />}>
          {activeTab === 'season' && (
            <SeasonScreen
              today={today}
              profile={profile}
              log={log}
              completedTaskIds={completedTaskIds}
              onToggleTask={toggleTask}
              inspections={inspections}
              onNextAction={handleNextAction}
              nextAction={nextAction}
            />
          )}
          {activeTab === 'diagnose' && <DiagnoseScreen inspections={targetColonyExists ? inspections : []} nextAction={nextAction} />}
          {activeTab === 'inspect' && (
            <InspectScreen
              initialColonyId={targetColonyExists ? nextAction?.colonyId : undefined}
              colonies={profile?.colonies ?? []}
              inspections={inspections}
              onAdd={addInspection}
              onUpdate={updateInspection}
              onDelete={removeInspection}
            />
          )}
          {activeTab === 'learn' && <LearnScreen />}
          {activeTab === 'myhive' && (
            <MyHiveScreen
              profile={profile}
              onUpdate={updateProfile}
              log={log}
              onAddEntry={addCustomEntry}
              onDeleteEntry={deleteEntry}
              onAddColony={addColony}
              onUpdateColony={updateColony}
              onRemoveColony={colonyRemoval.remove}
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
      <BeeFab onActivate={handsFree.start} isActive={handsFree.isActive || handsFree.isStarting} />
      <PwaInstallHint
        isInstalled={pwaInstall.isInstalled}
        installSupported={pwaInstall.installSupported}
        onInstall={pwaInstall.promptInstall}
        compact
        dismissible
        floating
      />
      {(handsFree.isActive || handsFree.isStarting) && <VoiceOverlay isStarting={handsFree.isStarting} onStop={handsFree.stop} lastCommand={handsFree.lastCommand} />}
      {handsFree.permissionBlocked && (
        <VoicePermissionModal
          onRetry={handsFree.retryPermission}
          onDismiss={handsFree.dismissPermission}
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
