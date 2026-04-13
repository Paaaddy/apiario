import { useSeason } from '../hooks/useSeason'
import TaskCard from '../components/TaskCard'

export default function SeasonScreen({ profile }) {
  const { label, icon, week, tasks } = useSeason(profile)

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-honey px-6 pt-10 pb-6">
        <p className="text-brown-light text-xs uppercase tracking-widest font-medium mb-1">
          {label} · Week {week}
        </p>
        <h1 className="font-serif text-3xl font-bold text-brown">
          {icon} This week's tasks
        </h1>
        <p className="text-brown-light text-sm mt-1">{tasks.length} things to check</p>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-center text-brown-mid py-8 font-serif text-lg">
            Nothing urgent this week. Check back soon.
          </p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
