import { useState, useCallback, useRef, useEffect } from 'react'
import { useProfile } from './hooks/useProfile'
import { useVoice } from './hooks/useVoice'
import BottomNav from './components/BottomNav'
import BeeFab from './components/BeeFab'
import VoiceOverlay from './components/VoiceOverlay'
import Onboarding from './screens/Onboarding'
import SeasonScreen from './screens/SeasonScreen'
import DiagnoseScreen from './screens/DiagnoseScreen'
import MyHiveScreen from './screens/MyHiveScreen'

export default function App() {
  const { profile, updateProfile } = useProfile()
  const [activeTab, setActiveTab] = useState('season')
  const [voiceActive, setVoiceActive] = useState(false)
  const [lastCommand, setLastCommand] = useState('')
  const { speak, stopSpeaking, startListening, stopListening } = useVoice()

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
    }, () => {
      handleVoiceStopRef.current()
    })
  }, [voiceActive, speak, startListening, handleVoiceStop])

  if (!profile.onboardingDone) {
    return (
      <div className="flex flex-col h-full bg-cream">
        <Onboarding
          onComplete={(answers) => updateProfile({ ...answers, onboardingDone: true })}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-cream">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'season' && <SeasonScreen profile={profile} />}
        {activeTab === 'diagnose' && <DiagnoseScreen />}
        {activeTab === 'myhive' && <MyHiveScreen profile={profile} onUpdate={updateProfile} />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <BeeFab onActivate={handleVoiceActivate} isActive={voiceActive} />
      {voiceActive && <VoiceOverlay onStop={handleVoiceStop} lastCommand={lastCommand} />}
    </div>
  )
}
