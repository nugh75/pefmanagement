import { getStudentProfiles } from '@/lib/actions/students'
import { StudentsClient } from './client'

export default async function StudentsPage() {
  const { data: students, error } = await getStudentProfiles()

  return (
    <div className="space-y-6">
      <StudentsClient 
        students={students || []} 
        error={error}
      />
    </div>
  )
}
