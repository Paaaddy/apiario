// Shared uppercase section heading used by the inspection form and the colony
// detail screen; it was a byte-identical copy in both.
export default function SectionLabel({ text, color, mono }) {
  return (
    <p style={{ margin: '20px 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color, fontFamily: mono ? 'var(--theme-font-mono)' : undefined }}>
      {text}
    </p>
  )
}
