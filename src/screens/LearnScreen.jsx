import { useState, useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { strings as s } from '../i18n/strings'
import { themeColors } from '../utils/themeTokens'
import knowledge from '../data/knowledge.json'

export default function LearnScreen() {
  const { t, locale } = useLanguage()
  const { theme } = useTheme()
  const [search, setSearch] = useState('')
  const [selectedFact, setSelectedFact] = useState(null)

  const c = themeColors(theme)
  const bg = c.formBg
  const ink = c.formInk
  const inkMid = c.formInkMid
  const border = c.border
  const accent = c.accent

  const filteredFacts = useMemo(() => {
    const q = search.toLowerCase()
    return knowledge.filter(f => {
      const content = f.content[locale || 'de']
      return content.title.toLowerCase().includes(q) || 
             content.summary.toLowerCase().includes(q) ||
             f.tags.some(t => t.toLowerCase().includes(q))
    })
  }, [search, locale])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: bg, color: ink, position: 'relative' }}>
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, background: bg, zIndex: 1 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--theme-font-head)' }}>
          {t(s.nav_learn)}
        </h1>
        <input 
          type="text" 
          placeholder={t(s.learn_search_placeholder) || 'Search...'} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${border}`, background: c.formInputBg, color: ink, fontSize: 16 }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredFacts.map(f => {
            const content = f.content[locale || 'de']
            return (
              <div 
                key={f.id} 
                onClick={() => setSelectedFact(f)}
                style={{ padding: '16px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{content.title}</h3>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: accent, color: '#fff', fontWeight: 700, textTransform: 'uppercase' }}>
                    {f.difficulty}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: inkMid, lineHeight: 1.4 }}>{content.summary}</p>
              </div>
            )
          })}
        </div>
      </div>

      {selectedFact && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: bg, padding: 24, borderRadius: 24, maxWidth: 500, width: '100%', border: `1px solid ${border}`, position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setSelectedFact(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: inkMid }}>✕</button>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, fontFamily: 'var(--theme-font-head)' }}>
              {selectedFact.content[locale || 'de'].title}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 16, lineHeight: 1.5 }}>
              {selectedFact.content[locale || 'de'].details}
            </p>
            <div style={{ padding: '12px', background: c.formInputBg, borderRadius: 12, fontSize: 12, color: inkMid, fontStyle: 'italic' }}>
              Source: {selectedFact.content[locale || 'de'].source}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
