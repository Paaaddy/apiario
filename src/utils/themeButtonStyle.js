export function getButtonStyle(theme, isActive) {
  if (theme === 'b') {
    return isActive
      ? { background: '#2b1d0e', borderColor: '#2b1d0e', color: '#f4ecd8' }
      : { background: '#fff', borderColor: '#c8b890', color: '#2b1d0e' }
  }
  if (theme === 'c') {
    return isActive
      ? { background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.4)', color: '#1c1410' }
      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.15)', color: '#6b5843' }
  }
  return isActive
    ? { background: '#f5a623', borderColor: '#e8890c', color: '#3d1f00' }
    : { background: '#fff', borderColor: '#fde68a', color: '#92400e' }
}
