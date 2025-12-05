'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Building2,
  Calendar,
  BookOpen,
  GraduationCap,
  Users,
  UserCog,
  ClipboardList,
  Clock,
  CreditCard,
  FileCheck,
  Award,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  School,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { labels } from '@/lib/labels'
import { hasPermission, Permission } from '@/lib/permissions'
import { UserRole } from '@/types/roles'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
  children?: NavItem[]
}

const navigationGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principale',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: Home },
    ],
  },
  {
    title: 'Anagrafica',
    items: [
      { 
        title: 'Dipartimenti', 
        href: '/dashboard/departments', 
        icon: Building2,
        permission: 'departments:read',
      },
      { 
        title: 'Anni Accademici', 
        href: '/dashboard/academic-years', 
        icon: Calendar,
        permission: 'academicYears:read',
      },
      { 
        title: 'Tipologie Percorso', 
        href: '/dashboard/course-types', 
        icon: BookOpen,
        permission: 'courseTypes:read',
      },
      { 
        title: 'Classi di Concorso', 
        href: '/dashboard/competition-classes', 
        icon: GraduationCap,
        permission: 'competitionClasses:read',
      },
      { 
        title: 'Istituti Scolastici', 
        href: '/dashboard/schools', 
        icon: School,
        permission: 'schools:read',
      },
    ],
  },
  {
    title: 'Utenti',
    items: [
      { 
        title: 'Gestione Utenti', 
        href: '/dashboard/users', 
        icon: UserCog,
        permission: 'users:read',
      },
      { 
        title: 'Corsisti', 
        href: '/dashboard/students', 
        icon: Users,
        permission: 'students:read',
      },
      { 
        title: 'Docenti', 
        href: '/dashboard/teachers', 
        icon: Briefcase,
        permission: 'teachers:read',
      },
      { 
        title: 'Tutor', 
        href: '/dashboard/tutors', 
        icon: Users,
        permission: 'tutors:read',
      },
    ],
  },
  {
    title: 'Didattica',
    items: [
      { 
        title: 'Insegnamenti', 
        href: '/dashboard/courses', 
        icon: BookOpen,
        permission: 'courses:read',
      },
      { 
        title: 'Lezioni', 
        href: '/dashboard/lessons', 
        icon: Clock,
        permission: 'lessons:read',
      },
      { 
        title: 'Progetti Formativi', 
        href: '/dashboard/training-projects', 
        icon: ClipboardList,
        permission: 'trainingProjects:read',
      },
    ],
  },
  {
    title: 'Tirocini',
    items: [
      { 
        title: 'Tirocinio Diretto', 
        href: '/dashboard/direct-internships', 
        icon: Briefcase,
        permission: 'internships:read',
      },
      { 
        title: 'Tirocinio Indiretto', 
        href: '/dashboard/indirect-internships', 
        icon: Briefcase,
        permission: 'internships:read',
      },
    ],
  },
  {
    title: 'Amministrazione',
    items: [
      { 
        title: 'Pagamenti', 
        href: '/dashboard/payments', 
        icon: CreditCard,
        permission: 'payments:read',
      },
      { 
        title: 'Prove Finali', 
        href: '/dashboard/exams', 
        icon: FileCheck,
        permission: 'exams:read',
      },
      { 
        title: 'Riconoscimenti', 
        href: '/dashboard/recognitions', 
        icon: Award,
        permission: 'recognitions:read',
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole | undefined

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    if (!userRole) return []
    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(userRole, item.permission)
    })
  }

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900">PEF Management</h1>
            <p className="text-xs text-slate-500">Sistema Gestione</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navigationGroups.map((group) => {
          const filteredItems = filterNavItems(group.items)
          if (filteredItems.length === 0) return null

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.children ? (
                        <Collapsible defaultOpen className="group/collapsible">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="w-full justify-between">
                              <span className="flex items-center gap-3">
                                <item.icon className="w-4 h-4" />
                                {item.title}
                              </span>
                              <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === child.href}
                                  >
                                    <Link href={child.href || '#'}>
                                      {child.title}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          className={cn(
                            'transition-colors',
                            pathname === item.href && 'bg-blue-50 text-blue-700 font-medium'
                          )}
                        >
                          <Link href={item.href || '#'} className="flex items-center gap-3">
                            <item.icon className="w-4 h-4" />
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium">
                  {getInitials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-slate-500">
                  {userRole ? labels.roles[userRole] : 'Utente'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Impostazioni
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-red-600 focus:text-red-600 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
