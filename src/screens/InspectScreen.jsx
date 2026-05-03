import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import InspectionTab from './InspectionTab'
import LanguageToggle from '../components/LanguageToggle'
import HexWatermark from '../components/HexWatermark'

export default function InspectScreen({
  colonies = [],
  inspections = [],
  onAdd,
  onUpdate,
  onDelete,
}) {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const content = (
    <InspectionTab
      colonies={colonies}
      inspections={inspections}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  )

  if (theme === 'b') {
    return (
      <div style={{ minHeight: '100%', background: '#f4ecd8' }}>
        <div style={{ padding: '42px 24px 0', position: 'sticky', top: 0, zIndex: 20, background: '#f4ecd8', borderBottom: '1px solid #c8b890' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontFamily: 'var(--theme-font-mono)', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b5838' }}>
              {t(s.nav_inspect)}
            </p>
            <LanguageToggle />
          </div>
          <h1 style={{ margin: '12px 0 16px', fontFamily: 'var(--theme-font-head)', fontSize: 38, fontWeight: 400, color: '#2b1d0e', letterSpacing: -0.3, lineHeight: 1 }}>
            📋 <span style={{ fontStyle: 'italic' }}>{t(s.nav_inspect)}.</span>
          </h1>
        </div>
        <div style={{ padding: '16px 24px 80px' }}>
          {content}
        </div>
      </div>
    )
  }

  if (theme === 'c') {
    return (
      <div style={{ minHeight: '100%', background: '#faf6ee', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(180deg, rgba(245,166,35,0.35) 0%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(250,246,238,0.95)', backdropFilter: 'blur(8px)', padding: '42px 22px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1c1410' }}>
              {t(s.nav_inspect)}
            </span>
            <LanguageToggle />
          </div>
          <h1 style={{ margin: '10px 0 0', fontFamily: '"Playfair Display", serif', fontSize: 48, lineHeight: 0.95, fontWeight: 700, color: '#1c1410', letterSpacing: -1 }}>
            📋 <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{t(s.nav_inspect)}.</span>
          </h1>
        </div>
        <div style={{ padding: '16px 22px 80px' }}>
          {content}
        </div>
      </div>
    )
  }

  // Theme A: Honeycomb
  return (
    <div className="relative flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-4 sticky top-0 z-20 border-b border-honey-dark/20 shadow-sm shadow-honey-dark/20" style={{ overflow: 'hidden' }}>
        <HexWatermark />
        <div className="relative flex items-start justify-between gap-3">
          <h1 className="font-serif text-2xl font-bold text-brown">📋 {t(s.nav_inspect)}</h1>
          <LanguageToggle />
        </div>
      </div>
      <div className="px-4 pt-6 pb-20">
        {content}
      </div>
    </div>
  )
}
