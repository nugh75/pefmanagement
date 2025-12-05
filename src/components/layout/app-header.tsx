'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

// Breadcrumb mapping
const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  departments: 'Dipartimenti',
  'academic-years': 'Anni Accademici',
  'course-types': 'Tipologie Percorso',
  'competition-classes': 'Classi di Concorso',
  schools: 'Istituti Scolastici',
  users: 'Utenti',
  students: 'Corsisti',
  teachers: 'Docenti',
  tutors: 'Tutor',
  courses: 'Insegnamenti',
  lessons: 'Lezioni',
  'training-projects': 'Progetti Formativi',
  'direct-internships': 'Tirocinio Diretto',
  'indirect-internships': 'Tirocinio Indiretto',
  payments: 'Pagamenti',
  exams: 'Prove Finali',
  recognitions: 'Riconoscimenti',
  settings: 'Impostazioni',
  new: 'Nuovo',
  edit: 'Modifica',
}

export function AppHeader() {
  useSession()
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    const label = pathNameMap[segment] || segment
    const isLast = index === pathSegments.length - 1
    return { href, label, isLast }
  })

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 lg:px-6">
      <SidebarTrigger className="-ml-2" />
      
      <Separator orientation="vertical" className="h-6" />

      {/* Breadcrumbs */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb) => (
            <BreadcrumbItem key={crumb.href}>
              {crumb.isLast ? (
                <BreadcrumbPage className="font-medium text-slate-900">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink
                    href={crumb.href}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Cerca..."
          className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white"
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-4 text-center text-sm text-slate-500">
            Nessuna notifica
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
