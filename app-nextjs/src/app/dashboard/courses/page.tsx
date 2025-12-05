import { getCourses } from '@/lib/actions/courses'
import { getDepartments } from '@/lib/actions/departments'
import { CoursesClient } from './client'

export default async function CoursesPage() {
  const [coursesResult, departmentsResult] = await Promise.all([
    getCourses(),
    getDepartments()
  ])

  return (
    <div className="space-y-6">
      <CoursesClient 
        courses={coursesResult.data || []} 
        departments={departmentsResult.data || []}
        error={coursesResult.error || departmentsResult.error}
      />
    </div>
  )
}
