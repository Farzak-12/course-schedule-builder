import { CourseSearch } from '@/components/selection/CourseSearch'
import { ControlList } from '@/components/selection/ControlList'

export function Sidebar() {
  return (
    <aside className="w-full space-y-4 md:w-75 md:shrink-0">
      <div className="space-y-2">
        <h2 className="font-display text-xl text-text">Your courses</h2>
        <CourseSearch />
      </div>
      <ControlList />
    </aside>
  )
}
