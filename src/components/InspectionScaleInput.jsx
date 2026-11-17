/**
 * Renders a stepped scale. Each step shows its number and its descriptor
 * wording, so the scale stays comparable while also being meaningful.
 */
import { themeColors } from '../utils/themeTokens'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'

function stepKeysFromProps(props) {
  return props.stepKeys ?? props.steps ?? props.descriptorKeys ?? props.descriptors ?? props.stepLabels ?? null
}

function descriptorFor(key, t) {
  if (key == null) return ''
  if (typeof key === 'string') {
    const entry = s[key]
    return entry ? t(entry) : key
  }
  return t(key)
}

export default function InspectionScaleInput({ value, onChange, theme = 'a', labelId, stepKeys, steps, descriptorKeys, descriptors, stepLabels }) {
  const { t } = useLanguage()
  const c = themeColors(theme)
  const keys = stepKeysFromProps({ stepKeys, steps, descriptorKeys, descriptors, stepLabels }) ?? [1, 2, 3, 4, 5]
  const hasDescriptors = Array.isArray(keys) && typeof keys[0] !== 'number'
  const list = Array.isArray(keys) ? keys : [1, 2, 3, 4, 5]
  const max = list.length

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-valuenow={value ?? undefined}
      aria-valuemin={1}
      aria-valuemax={max}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
    >
      {list.map((key, index) => {
        const n = index + 1
        const selected = value === n
        const descriptor = hasDescriptors ? descriptorFor(key, t) : String(n)
        const label = hasDescriptors ? `${n} ${descriptor}` : String(n)
        return (
          <button
            key={hasDescriptors ? key : n}
            type="button"
            onClick={() => onChange(n === value ? null : n)}
            aria-pressed={selected}
            aria-label={label}
            style={{
              width: 44,
              minHeight: 44,
              padding: '4px 2px',
              borderRadius: theme === 'b' ? 4 : '50%',
              border: selected ? 'none' : `2px solid ${c.scaleBorder}`,
              background: selected ? c.scaleActiveBg : 'transparent',
              color: selected ? '#fff' : c.scaleColor,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.1,
            }}
          >
            <span style={{ fontSize: 15 }}>{n}</span>
            {hasDescriptors && (
              <span style={{ fontSize: 9, fontWeight: 600, textAlign: 'center' }}>{descriptor}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
