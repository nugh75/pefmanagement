import { getCompetitionClasses } from '@/lib/actions/competition-classes'
import { CompetitionClassesClient } from './client'

export default async function CompetitionClassesPage() {
  const { data: competitionClasses, error } = await getCompetitionClasses()

  return (
    <div className="space-y-6">
      <CompetitionClassesClient 
        competitionClasses={competitionClasses || []} 
        error={error}
      />
    </div>
  )
}
