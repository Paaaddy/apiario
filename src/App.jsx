import { useState } from 'react'
import { useProfile } from './hooks/useProfile'
import BottomNav from './components/BottomNav'

// Screen stubs — replaced in later tasks
function SeasonScreen() { return <div className="p-4 font-serif text-brown">Season screen</div> }
function DiagnoseScreen() { return <div className="p-4 font-serif text-brown">Diagnose screen</div> }
function MyHiveScreen() { return <div className="p-4 font-serif text-brown">My Hive screen</div> }
function Onboarding({ onComplete }) {
  return (
    <div className="p-6">
      <h1 className="font-serif text-2xl text-brown">Welcome to Apiario</h1>
      <button onClick={onComplete} className="mt-4 bg-honey text-brown px-6 py-2 rounded-full font-medium">
        Skip onboarding
      </button>
    </div>
  )
}

export default function App() {
  const { profile, updateProfile } = useProfile()
  const [activeTab, setActiveTab] = useState('season')

  if (!profile.onboardingDone) {
    return (
      <div className="flex flex-col h-full bg-cream">
        <Onboarding onComplete={() => updateProfile({ onboardingDone: true })} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-cream">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'season' && <SeasonScreen />}
        {activeTab === 'diagnose' && <DiagnoseScreen />}
        {activeTab === 'myhive' && <MyHiveScreen />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
