import { getDepartments } from '@/lib/actions/departments'
import { DepartmentsClient } from './client'

export default async function DepartmentsPage() {
  const { data: departments, error } = await getDepartments()

  return (
    <div className="space-y-6">
      <DepartmentsClient 
        departments={departments || []} 
        error={error}
      />
    </div>
  )
}
