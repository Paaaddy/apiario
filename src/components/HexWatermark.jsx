import { memo } from 'react'

const HexWatermark = memo(function HexWatermark() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="hex-wm" patternUnits="userSpaceOnUse" width="42" height="48">
          <polygon points="21,4 38,14 38,34 21,44 4,34 4,14" fill="none" stroke="#3d1f00" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-wm)" />
    </svg>
  )
})

export default HexWatermark
