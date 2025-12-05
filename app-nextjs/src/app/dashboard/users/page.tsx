import { getUsers } from '@/lib/actions/users'
import { getDepartments } from '@/lib/actions/departments'
import { UsersClient } from './client'

export default async function UsersPage() {
  const [{ data: users, error: usersError }, { data: departments, error: departmentsError }] = await Promise.all([
    getUsers(),
    getDepartments()
  ])

  const error = usersError || departmentsError

  return (
    <div className="space-y-6">
      <UsersClient 
        users={users || []} 
        departments={departments || []}
        error={error}
      />
    </div>
  )
}
