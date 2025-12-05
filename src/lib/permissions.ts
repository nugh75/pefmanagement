import { UserRole } from '@/types/roles'

/**
 * Permission definitions for each role
 */
export type Permission = 
  | 'departments:read' | 'departments:write' | 'departments:delete'
  | 'academicYears:read' | 'academicYears:write' | 'academicYears:delete'
  | 'courseTypes:read' | 'courseTypes:write' | 'courseTypes:delete'
  | 'competitionClasses:read' | 'competitionClasses:write' | 'competitionClasses:delete'
  | 'schools:read' | 'schools:write' | 'schools:delete'
  | 'usrReferents:read' | 'usrReferents:write' | 'usrReferents:delete'
  | 'users:read' | 'users:write' | 'users:delete'
  | 'students:read' | 'students:write' | 'students:delete'
  | 'teachers:read' | 'teachers:write' | 'teachers:delete'
  | 'tutors:read' | 'tutors:write' | 'tutors:delete'
  | 'courses:read' | 'courses:write' | 'courses:delete'
  | 'lessons:read' | 'lessons:write' | 'lessons:delete'
  | 'attendances:read' | 'attendances:write'
  | 'trainingProjects:read' | 'trainingProjects:write' | 'trainingProjects:delete'
  | 'internships:read' | 'internships:write' | 'internships:delete'
  | 'payments:read' | 'payments:write' | 'payments:delete'
  | 'exams:read' | 'exams:write' | 'exams:delete'
  | 'recognitions:read' | 'recognitions:write' | 'recognitions:delete'
  | 'cfuCategories:read' | 'cfuCategories:write' | 'cfuCategories:delete'

/**
 * Role-based permission matrix
 * TLC: Full access to everything
 * DIPARTIMENTO: Full access to department-scoped data
 * DOCENTE: Access to assigned courses and students
 * CORSISTA: Access to own data only
 * COORD_TUTOR: Access to indirect internships
 * COLLAB_TUTOR: Access to direct internships
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  TLC: [
    // Full admin access
    'departments:read', 'departments:write', 'departments:delete',
    'academicYears:read', 'academicYears:write', 'academicYears:delete',
    'courseTypes:read', 'courseTypes:write', 'courseTypes:delete',
    'competitionClasses:read', 'competitionClasses:write', 'competitionClasses:delete',
    'schools:read', 'schools:write', 'schools:delete',
    'usrReferents:read', 'usrReferents:write', 'usrReferents:delete',
    'users:read', 'users:write', 'users:delete',
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write', 'teachers:delete',
    'tutors:read', 'tutors:write', 'tutors:delete',
    'courses:read', 'courses:write', 'courses:delete',
    'lessons:read', 'lessons:write', 'lessons:delete',
    'attendances:read', 'attendances:write',
    'trainingProjects:read', 'trainingProjects:write', 'trainingProjects:delete',
    'internships:read', 'internships:write', 'internships:delete',
    'payments:read', 'payments:write', 'payments:delete',
    'exams:read', 'exams:write', 'exams:delete',
    'recognitions:read', 'recognitions:write', 'recognitions:delete',
    'cfuCategories:read', 'cfuCategories:write', 'cfuCategories:delete',
  ],
  
  DIPARTIMENTO: [
    // Department-scoped access
    'departments:read',
    'academicYears:read', 'academicYears:write',
    'courseTypes:read', 'courseTypes:write',
    'competitionClasses:read', 'competitionClasses:write',
    'schools:read', 'schools:write',
    'users:read', 'users:write',
    'students:read', 'students:write',
    'teachers:read', 'teachers:write',
    'tutors:read', 'tutors:write',
    'courses:read', 'courses:write', 'courses:delete',
    'lessons:read', 'lessons:write', 'lessons:delete',
    'attendances:read', 'attendances:write',
    'trainingProjects:read', 'trainingProjects:write', 'trainingProjects:delete',
    'internships:read', 'internships:write', 'internships:delete',
    'payments:read', 'payments:write',
    'exams:read', 'exams:write', 'exams:delete',
    'recognitions:read', 'recognitions:write', 'recognitions:delete',
    'cfuCategories:read',
  ],
  
  DOCENTE: [
    // Teacher access: assigned courses and their students
    'departments:read',
    'academicYears:read',
    'courseTypes:read',
    'competitionClasses:read',
    'teachers:read',
    'students:read',
    'courses:read',
    'lessons:read', 'lessons:write',
    'attendances:read', 'attendances:write',
    'trainingProjects:read',
    'exams:read',
    'recognitions:read',
  ],
  
  CORSISTA: [
    // Student access: own data only
    'departments:read',
    'academicYears:read',
    'courseTypes:read',
    'competitionClasses:read',
    'courses:read',
    'lessons:read',
    'attendances:read',
    'trainingProjects:read',
    'internships:read',
    'payments:read',
    'exams:read',
    'recognitions:read',
  ],
  
  COORD_TUTOR: [
    // Coordinator tutor: indirect internships
    'departments:read',
    'academicYears:read',
    'courseTypes:read',
    'students:read',
    'trainingProjects:read',
    'internships:read', 'internships:write',
    'attendances:read', 'attendances:write',
    'recognitions:read',
  ],
  
  COLLAB_TUTOR: [
    // Collaborator tutor: direct internships
    'departments:read',
    'academicYears:read',
    'schools:read',
    'students:read',
    'trainingProjects:read',
    'internships:read', 'internships:write',
    'attendances:read', 'attendances:write',
    'recognitions:read',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? []
}
