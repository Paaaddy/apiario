/**
 * Renders a 1–5 tap-to-select scale.
 * Each segment is ≥44px for mobile tap targets.
 * Tap the same value again to deselect (returns null).
 */
import { themeColors } from '../utils/themeTokens'

export default function InspectionScaleInput({ value, onChange, theme = 'a', labelId }) {
  const c = themeColors(theme)
  return (
    <div style={{ display: 'flex', gap: 8 }} role="group" aria-labelledby={labelId}>
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value >= n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? null : n)}
            aria-pressed={selected}
            aria-label={String(n)}
            style={{
              width: 44,
              height: 44,
              borderRadius: theme === 'b' ? 4 : '50%',
              border: selected
                ? 'none'
                : `2px solid ${c.scaleBorder}`,
              background: selected
                ? c.scaleActiveBg
                : 'transparent',
              color: selected ? '#fff' : c.scaleColor,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
