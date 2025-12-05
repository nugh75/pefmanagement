import { getCoordinatorTutors, getCollaboratorTutors } from '@/lib/actions/tutors'
import { getDepartments } from '@/lib/actions/departments'
import { getSchools } from '@/lib/actions/schools'
import { TutorsClient } from './client'

export default async function TutorsPage() {
  const [
    { data: coordinators, error: error1 },
    { data: collaborators, error: error2 },
    { data: departments },
    { data: schools }
  ] = await Promise.all([
    getCoordinatorTutors(),
    getCollaboratorTutors(),
    getDepartments(),
    getSchools()
  ])

  const error = error1 || error2

  return (
    <div className="space-y-6">
      <TutorsClient 
        coordinators={coordinators || []}
        collaborators={collaborators || []}
        departments={departments || []}
        schools={schools || []}
        error={error}
      />
    </div>
  )
}
