import { themeColors } from './themeTokens'

export function getButtonStyle(theme, isActive) {
  const c = themeColors(theme)
  if (theme === 'b') {
    return isActive
      ? { background: c.ink, borderColor: c.ink, color: c.bg }
      : { background: '#fff', borderColor: c.rule, color: c.ink }
  }
  if (theme === 'c') {
    return isActive
      ? { background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.4)', color: c.ink }
      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.15)', color: c.inkMid }
  }
  return isActive
    ? { background: c.accent, borderColor: c.accentDark, color: c.ink }
    : { background: '#fff', borderColor: '#fde68a', color: c.inkMid }
}
