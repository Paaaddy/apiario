import { useState } from 'react'
import { useProfile } from './hooks/useProfile'
import BottomNav from './components/BottomNav'
import Onboarding from './screens/Onboarding'
import SeasonScreen from './screens/SeasonScreen'
import DiagnoseScreen from './screens/DiagnoseScreen'
import MyHiveScreen from './screens/MyHiveScreen'

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
        {activeTab === 'myhive' && <MyHiveScreen profile={profile} onUpdate={updateProfile} />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
