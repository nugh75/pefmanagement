import { getCourseTypes } from '@/lib/actions/course-types'
import { CourseTypesClient } from './client'

export default async function CourseTypesPage() {
  const { data: courseTypes, error } = await getCourseTypes()

  return (
    <div className="space-y-6">
      <CourseTypesClient 
        courseTypes={courseTypes || []} 
        error={error}
      />
    </div>
  )
}
