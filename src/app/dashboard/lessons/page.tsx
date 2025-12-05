import { getLessons } from '@/lib/actions/lessons'
import { getCourses } from '@/lib/actions/courses'
import { getTeacherProfiles } from '@/lib/actions/teachers'
import { LessonsClient } from './client'

export default async function LessonsPage() {
  const [lessonsResult, coursesResult, teachersResult] = await Promise.all([
    getLessons(),
    getCourses(),
    getTeacherProfiles()
  ])

  return (
    <div className="space-y-6">
      <LessonsClient 
        lessons={lessonsResult.data || []} 
        courses={coursesResult.data || []}
        teachers={teachersResult.data || []}
        error={lessonsResult.error || coursesResult.error || teachersResult.error}
      />
    </div>
  )
}
