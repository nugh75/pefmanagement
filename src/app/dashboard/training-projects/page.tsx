import { getTrainingProjects } from '@/lib/actions/training-projects'
import { getStudentProfiles } from '@/lib/actions/students'
import { getCourseTypes } from '@/lib/actions/course-types'
import { getAcademicYears } from '@/lib/actions/academic-years'
import { getDepartments } from '@/lib/actions/departments'
import { TrainingProjectsClient } from './client'

export default async function TrainingProjectsPage() {
  const [projectsResult, studentsResult, courseTypesResult, yearsResult, departmentsResult] = await Promise.all([
    getTrainingProjects(),
    getStudentProfiles(),
    getCourseTypes(),
    getAcademicYears(),
    getDepartments()
  ])

  return (
    <div className="space-y-6">
      <TrainingProjectsClient 
        projects={projectsResult.data || []} 
        students={studentsResult.data || []}
        courseTypes={courseTypesResult.data || []}
        academicYears={yearsResult.data || []}
        departments={departmentsResult.data || []}
        error={projectsResult.error || studentsResult.error}
      />
    </div>
  )
}
