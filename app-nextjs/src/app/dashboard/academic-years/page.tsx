import { getAcademicYears } from '@/lib/actions/academic-years'
import { AcademicYearsClient } from './client'

export default async function AcademicYearsPage() {
  const { data: academicYears, error } = await getAcademicYears()

  return (
    <div className="space-y-6">
      <AcademicYearsClient 
        academicYears={academicYears || []} 
        error={error}
      />
    </div>
  )
}
