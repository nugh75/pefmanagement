import { UserRole } from './roles'
import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
    departmentId: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      departmentId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    departmentId: string | null
  }
}
