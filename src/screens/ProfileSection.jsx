import { useMemo } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { strings as s } from '../i18n/strings'
import ThemeSwitcher from '../components/ThemeSwitcher'

function OptionGroup({ title, options, currentValue, fieldKey, onUpdate }) {
  return (
    <div className="mb-6">
      <h3 className="font-serif text-sm font-semibold text-brown-mid uppercase tracking-widest mb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {options.map(({ label, value }) => (
          <button
            key={String(value)}
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

export default function ProfileSection({ profile, onUpdate }) {
  const { t } = useLanguage()

  const HIVE_OPTIONS = useMemo(() => [
    { label: t(s.hive_1),  value: 1  },
    { label: t(s.hive_2),  value: 2  },
    { label: t(s.hive_5),  value: 5  },
    { label: t(s.hive_10), value: 10 },
  ], [t])
  const ZONE_OPTIONS = useMemo(() => [
    { label: t(s.zone_northern),      value: 'northern'      },
    { label: t(s.zone_central),       value: 'central'       },
    { label: t(s.zone_mediterranean), value: 'mediterranean' },
    { label: t(s.zone_other),         value: 'other'         },
  ], [t])
  const EXPERIENCE_OPTIONS = useMemo(() => [
    { label: t(s.exp_0), value: 0 },
    { label: t(s.exp_1), value: 1 },
    { label: t(s.exp_2), value: 2 },
  ], [t])

  return (
    <div>
      <h2 className="font-serif text-base font-semibold text-brown mb-4">{t(s.profile_title)}</h2>
      <ThemeSwitcher />
      <OptionGroup
        title={t(s.hive_count_title)}
        options={HIVE_OPTIONS}
        currentValue={profile.hiveCount}
        fieldKey="hiveCount"
        onUpdate={onUpdate}
      />
      <OptionGroup
        title={t(s.climate_title)}
        options={ZONE_OPTIONS}
        currentValue={profile.climateZone}
        fieldKey="climateZone"
        onUpdate={onUpdate}
      />
      <OptionGroup
        title={t(s.experience_title)}
        options={EXPERIENCE_OPTIONS}
        currentValue={profile.experience}
        fieldKey="experience"
        onUpdate={onUpdate}
      />
    </div>
  )
}
