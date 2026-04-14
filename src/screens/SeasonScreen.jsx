import { useLanguage } from '../hooks/useLanguage'
import { useSeason } from '../hooks/useSeason'
import { strings as s } from '../i18n/strings'
import TaskCard from '../components/TaskCard'
import LanguageToggle from '../components/LanguageToggle'

export default function SeasonScreen({ profile, log, completedTaskIds, onToggleTask }) {
  const { t } = useLanguage()
  const { label, icon, week, tasks } = useSeason(profile)

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6 sticky top-0 z-20 border-b border-honey-dark/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-brown-light text-xs uppercase tracking-widest font-medium mb-1">
              {t(label)} · {t(s.season_week)} {week}
            </p>
            <h1 className="font-serif text-3xl font-bold text-brown">
              {icon} {t(s.season_this_week)}
            </h1>
            <p className="text-brown-light text-sm mt-1">
              {tasks.length} {t(s.season_tasks_noun)}
            </p>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-center text-brown-mid py-8 font-serif text-lg">
            {t(s.season_nothing)}
          </p>
        ) : (
          tasks.map((task) => {
            const logEntry = log?.find((e) => e.type === 'task' && e.taskId === task.id)
            return (
              <TaskCard
                key={task.id}
                task={task}
                isChecked={completedTaskIds?.has(task.id) ?? false}
                checkedDate={logEntry?.completedAt ?? null}
                onToggle={onToggleTask ? () => onToggleTask(task) : undefined}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
