import { useState } from 'react'
import { useProfile } from './hooks/useProfile'
import BottomNav from './components/BottomNav'
import Onboarding from './screens/Onboarding'
import SeasonScreen from './screens/SeasonScreen'

function DiagnoseScreen() { return <div className="p-4 font-serif text-brown">Diagnose screen</div> }
function MyHiveScreen() { return <div className="p-4 font-serif text-brown">My Hive screen</div> }

export default function App() {
  const { profile, updateProfile } = useProfile()
  const [activeTab, setActiveTab] = useState('season')

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
        {activeTab === 'myhive' && <MyHiveScreen />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
