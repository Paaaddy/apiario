import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import LanguageToggle from '../components/LanguageToggle'
import LogSection from './LogSection'
import ProfileSection from './ProfileSection'
import ColoniesSection from './ColoniesSection'
import InspectionTab from './InspectionTab'
import MyHiveTabStrip from '../components/MyHiveTabStrip'
import PwaInstallHint from '../components/PwaInstallHint'
import HexWatermark from '../components/HexWatermark'

export default function MyHiveScreen({
  profile,
  onUpdate,
  log = [],
  onAddEntry,
  onDeleteEntry,
  onAddColony,
  onUpdateColony,
  onRemoveColony,
  inspections = [],
  onAddInspection,
  onUpdateInspection,
  onDeleteInspection,
  pwaInstall = { isInstalled: true, installSupported: false, promptInstall: () => {} },
}) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('colonies')

  const colonies = profile?.colonies ?? []

  function renderTabContent() {
    switch (activeTab) {
      case 'colonies':
        return (
          <>
            <div style={{ marginBottom: 16 }}>
              <PwaInstallHint isInstalled={pwaInstall.isInstalled} installSupported={pwaInstall.installSupported} onInstall={pwaInstall.promptInstall} compact dismissible />
            </div>
            <ColoniesSection
              colonies={colonies}
              onAdd={onAddColony}
              onUpdate={onUpdateColony}
              onRemove={onRemoveColony}
              inspections={inspections}
              onAddInspection={onAddInspection}
            />
          </>
        )
      case 'inspections':
        return (
          <InspectionTab
            colonies={colonies}
            inspections={inspections}
            onAdd={onAddInspection}
            onUpdate={onUpdateInspection}
            onDelete={onDeleteInspection}
          />
        )
      case 'log':
        return <LogSection log={log} onAddEntry={onAddEntry} onDeleteEntry={onDeleteEntry} />
      case 'profile':
        return <ProfileSection profile={profile} onUpdate={onUpdate} />
      default:
        return null
    }
  }

  if (theme === 'b') {
    return (
      <div style={{ minHeight: '100%', background: '#f4ecd8' }}>
        <div style={{ padding: '42px 24px 0', position: 'sticky', top: 0, zIndex: 20, background: '#f4ecd8', borderBottom: '1px solid #c8b890' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontFamily: 'var(--theme-font-mono)', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b5838' }}>
              {t(s.myhive_title)}
            </p>
            <LanguageToggle />
          </div>
          <h1 style={{ margin: '12px 0 4px', fontFamily: 'var(--theme-font-head)', fontSize: 38, fontWeight: 400, color: '#2b1d0e', letterSpacing: -0.3, lineHeight: 1 }}>
            🐝 <span style={{ fontStyle: 'italic' }}>{t(s.myhive_title)}.</span>
          </h1>
          <p style={{ margin: '0 0 0', fontSize: 13, color: '#6b5838', fontFamily: 'var(--theme-font-head)' }}>
            {t(s.myhive_subtitle)}
          </p>
          <MyHiveTabStrip activeTab={activeTab} onTabChange={setActiveTab} theme="b" />
        </div>
        <div style={{ padding: '16px 24px 80px' }}>
          {renderTabContent()}
        </div>
      </div>
    )
  }

  if (theme === 'c') {
    const colonyCount = colonies.length
    return (
      <div style={{ minHeight: '100%', background: '#faf6ee', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(180deg, rgba(245,166,35,0.35) 0%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(250,246,238,0.95)', backdropFilter: 'blur(8px)' }}>
          <div style={{ position: 'relative', padding: '42px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1c1410' }}>
              {t(s.myhive_title)}
            </span>
            <LanguageToggle />
          </div>
          <div style={{ position: 'relative', padding: '10px 22px 0' }}>
            <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 48, lineHeight: 0.95, fontWeight: 700, color: '#1c1410', letterSpacing: -1 }}>
              🐝 <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{t(s.myhive_title)}.</span>
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b5843' }}>
              {colonyCount} {t(s.colonies_title).toLowerCase()} · {t(s.myhive_subtitle)}
            </p>
          </div>
          <div style={{ padding: '0 22px' }}>
            <MyHiveTabStrip activeTab={activeTab} onTabChange={setActiveTab} theme="c" />
          </div>
        </div>
        <div style={{ padding: '16px 22px 80px' }}>
          {renderTabContent()}
        </div>
      </div>
    )
  }

  // Theme A: Honeycomb
  return (
    <div className="relative flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-0 sticky top-0 z-20 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold text-brown">🐝 {t(s.myhive_title)}</h1>
            <p className="text-brown-light text-sm mt-1">{t(s.myhive_subtitle)}</p>
          </div>
          <LanguageToggle />
        </div>
        <div className="relative">
          <MyHiveTabStrip activeTab={activeTab} onTabChange={setActiveTab} theme="a" />
        </div>
      </div>

      <div className="px-4 pt-6 pb-20">
        {renderTabContent()}
      </div>
    </div>
  )
}
