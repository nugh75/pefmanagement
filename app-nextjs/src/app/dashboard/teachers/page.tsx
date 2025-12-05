import { getTeacherProfiles } from '@/lib/actions/teachers'
import { getDepartments } from '@/lib/actions/departments'
import { getCompetitionClasses } from '@/lib/actions/competition-classes'
import { TeachersClient } from './client'

export default async function TeachersPage() {
  const [
    { data: teachers, error: teachersError },
    { data: departments, error: departmentsError },
    { data: competitionClasses, error: classesError }
  ] = await Promise.all([
    getTeacherProfiles(),
    getDepartments(),
    getCompetitionClasses()
  ])

  const error = teachersError || departmentsError || classesError

  return (
    <div className="space-y-6">
      <TeachersClient 
        teachers={teachers || []}
        departments={departments || []}
        competitionClasses={competitionClasses || []}
        error={error}
      />
    </div>
  )
}
