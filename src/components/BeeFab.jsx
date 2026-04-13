export default function BeeFab({ onActivate, isActive }) {
  return (
    <button
      aria-label="Bee hands-free mode"
      onClick={onActivate}
      className={`fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 transition-all ${
        isActive
          ? 'bg-honey-dark border-honey animate-pulse-glow'
          : 'bg-honey border-honey-dark animate-bob'
      }`}
    >
      🐝
    </button>
  )
}
