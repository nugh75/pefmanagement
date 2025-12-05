import { getSchools } from '@/lib/actions/schools'
import { SchoolsClient } from './client'

export default async function SchoolsPage() {
  const { data: schools, error } = await getSchools()

  return (
    <div className="space-y-6">
      <SchoolsClient 
        schools={schools || []} 
        error={error}
      />
    </div>
  )
}
