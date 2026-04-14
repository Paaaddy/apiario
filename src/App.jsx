import { useState, useCallback, useRef, useEffect } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'

const DEBUG = new URLSearchParams(window.location.search).has('debug')
import { useProfile } from './hooks/useProfile'
import { useVoice } from './hooks/useVoice'
import { useTaskLog } from './hooks/useTaskLog'
import { usePwaInstallPrompt } from './hooks/usePwaInstallPrompt'
import BottomNav from './components/BottomNav'
import BeeFab from './components/BeeFab'
import VoiceOverlay from './components/VoiceOverlay'
import VoicePermissionModal from './components/VoicePermissionModal'
import Onboarding from './screens/Onboarding'
import SeasonScreen from './screens/SeasonScreen'
import DiagnoseScreen from './screens/DiagnoseScreen'
import MyHiveScreen from './screens/MyHiveScreen'
import PwaInstallHint from './components/PwaInstallHint'

function AppContent() {
  const { profile, updateProfile, addColony, updateColony, removeColony } = useProfile()
  const { log, completedTaskIds, toggleTask, addCustomEntry, deleteEntry } = useTaskLog()
  const [activeTab, setActiveTab] = useState('season')
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
    setVoiceActive(true)
    speak('Hands-free mode active. Say next, read again, diagnose, or stop.')
    startListening((command) => {
      setLastCommand(command)
      if (command.includes('stop')) {
        handleVoiceStopRef.current()
      } else if (command.includes('diagnose')) {
        setActiveTab('diagnose')
        speak('Opening diagnose.')
      } else if (command.includes('next')) {
        speak('Moving to next.')
      } else if (command.includes('read') || command.includes('repeat')) {
        speak('Repeating.')
      }
    }, (error) => {
      handleVoiceStopRef.current()
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        setVoicePermissionBlocked(true)
      }
    })
  }, [voiceActive, speak, startListening])

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
        <Onboarding
          onComplete={(answers) => updateProfile({ ...answers, onboardingDone: true })}
          pwaInstall={pwaInstall}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-cream">
      <main className="flex-1 overflow-y-auto">
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
    <LanguageProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      {DEBUG && <DebugPanel />}
    </LanguageProvider>
  )
}
