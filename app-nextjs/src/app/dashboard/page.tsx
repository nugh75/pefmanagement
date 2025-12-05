import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { labels } from '@/lib/labels'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap,
  ClipboardList,
  Clock,
  TrendingUp,
} from 'lucide-react'

async function getStats(role: string, departmentId: string | null) {
  // Get counts based on role
  const [
    departmentsCount,
    studentsCount,
    teachersCount,
    coursesCount,
    projectsCount,
    lessonsCount,
  ] = await Promise.all([
    prisma.department.count(),
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    departmentId 
      ? prisma.course.count({ where: { departmentId } })
      : prisma.course.count(),
    departmentId
      ? prisma.trainingProject.count({ where: { departmentId } })
      : prisma.trainingProject.count(),
    prisma.lesson.count(),
  ])

  return {
    departments: departmentsCount,
    students: studentsCount,
    teachers: teachersCount,
    courses: coursesCount,
    projects: projectsCount,
    lessons: lessonsCount,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getStats(
    session?.user?.role || 'CORSISTA',
    session?.user?.departmentId || null
  )

  const statCards = [
    {
      title: 'Dipartimenti',
      value: stats.departments,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      show: ['TLC', 'DIPARTIMENTO'].includes(session?.user?.role || ''),
    },
    {
      title: 'Corsisti',
      value: stats.students,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      show: ['TLC', 'DIPARTIMENTO', 'DOCENTE'].includes(session?.user?.role || ''),
    },
    {
      title: 'Docenti',
      value: stats.teachers,
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      show: ['TLC', 'DIPARTIMENTO'].includes(session?.user?.role || ''),
    },
    {
      title: 'Insegnamenti',
      value: stats.courses,
      icon: BookOpen,
      color: 'from-orange-500 to-orange-600',
      show: true,
    },
    {
      title: 'Progetti Formativi',
      value: stats.projects,
      icon: ClipboardList,
      color: 'from-pink-500 to-pink-600',
      show: ['TLC', 'DIPARTIMENTO', 'DOCENTE'].includes(session?.user?.role || ''),
    },
    {
      title: 'Lezioni',
      value: stats.lessons,
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      show: true,
    },
  ]

  const visibleCards = statCards.filter(card => card.show)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Benvenuto, {session?.user?.name || session?.user?.email}
        </h1>
        <p className="text-blue-100 text-lg">
          {labels.roles[session?.user?.role as keyof typeof labels.roles] || 'Utente'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium text-slate-500">
                  {stat.title}
                </CardDescription>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">
                  {stat.value.toLocaleString('it-IT')}
                </span>
                <span className="text-sm text-emerald-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  attivi
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Azioni Rapide</CardTitle>
            <CardDescription>Accedi velocemente alle funzioni più usate</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {['TLC', 'DIPARTIMENTO'].includes(session?.user?.role || '') && (
              <>
                <a
                  href="/dashboard/students/new"
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Nuovo Corsista</span>
                </a>
                <a
                  href="/dashboard/courses/new"
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Nuovo Insegnamento</span>
                </a>
              </>
            )}
            <a
              href="/dashboard/lessons"
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">Calendario Lezioni</span>
            </a>
            <a
              href="/dashboard/training-projects"
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">Progetti Formativi</span>
            </a>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Attività Recenti</CardTitle>
            <CardDescription>Ultime operazioni nel sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Sistema avviato</p>
                  <p className="text-xs text-slate-500">Benvenuto nel sistema PEF Management</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 text-center py-4">
                Le attività verranno mostrate qui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
