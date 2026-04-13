const HIVE_OPTIONS = [
  { label: '1 hive', value: 1 },
  { label: '2–3 hives', value: 2 },
  { label: '4–9 hives', value: 5 },
  { label: '10 or more', value: 10 },
]

const ZONE_OPTIONS = [
  { label: 'Northern Europe', value: 'northern' },
  { label: 'Central Europe', value: 'central' },
  { label: 'Mediterranean', value: 'mediterranean' },
  { label: 'Other', value: 'other' },
]

const EXPERIENCE_OPTIONS = [
  { label: 'First year', value: 0 },
  { label: '1–3 seasons', value: 1 },
  { label: 'Experienced (4+ years)', value: 2 },
]

function OptionGroup({ title, options, currentValue, fieldKey, onUpdate }) {
  return (
    <div className="mb-6">
      <h3 className="font-serif text-sm font-semibold text-brown-mid uppercase tracking-widest mb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {options.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => onUpdate({ [fieldKey]: value })}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
              currentValue === value
                ? 'bg-honey border-honey-dark text-brown'
                : 'bg-white border-amber-100 text-brown-mid'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MyHiveScreen({ profile, onUpdate }) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6">
        <h1 className="font-serif text-2xl font-bold text-brown">🐝 My Hive</h1>
        <p className="text-brown-light text-sm mt-1">Your profile shapes your guidance</p>
      </div>

      <div className="px-4 pt-6">
        <OptionGroup title="Number of hives" options={HIVE_OPTIONS} currentValue={profile.hiveCount} fieldKey="hiveCount" onUpdate={onUpdate} />
        <OptionGroup title="Climate zone" options={ZONE_OPTIONS} currentValue={profile.climateZone} fieldKey="climateZone" onUpdate={onUpdate} />
        <OptionGroup title="Experience level" options={EXPERIENCE_OPTIONS} currentValue={profile.experience} fieldKey="experience" onUpdate={onUpdate} />
      </div>
    </div>
  )
}
