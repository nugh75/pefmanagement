/**
 * User roles defined in the system
 * Matches the role field in the users table (VARCHAR(50))
 */
export type UserRole = 
  | 'TLC'
  | 'DIPARTIMENTO'
  | 'DOCENTE'
  | 'CORSISTA'
  | 'COORD_TUTOR'
  | 'COLLAB_TUTOR'

export const USER_ROLES: UserRole[] = [
  'TLC',
  'DIPARTIMENTO',
  'DOCENTE',
  'CORSISTA',
  'COORD_TUTOR',
  'COLLAB_TUTOR',
]

export const isValidRole = (role: string): role is UserRole => {
  return USER_ROLES.includes(role as UserRole)
}
