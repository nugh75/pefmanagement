import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/roles'

/**
 * LDAP Authentication Configuration
 * Configure your LDAP server settings here
 */
const LDAP_CONFIG = {
  url: process.env.LDAP_URL || 'ldap://localhost:389',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
  bindPassword: process.env.LDAP_BIND_PASSWORD || '',
  searchBase: process.env.LDAP_SEARCH_BASE || 'ou=users,dc=example,dc=com',
  searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
}

/**
 * Authenticate user via LDAP
 * This is a placeholder - implement with ldapts library when LDAP server is configured
 */
async function authenticateWithLdap(username: string, password: string): Promise<{
  email: string
  name: string
  ldapGroups?: string[]
} | null> {
  // Skip LDAP authentication when SKIP_LDAP is enabled (dev/testing mode)
  console.log('Auth Debug: Checking SKIP_LDAP', { 
    SKIP_LDAP: process.env.SKIP_LDAP, 
    username 
  })

  if (process.env.SKIP_LDAP === 'true') {
    // Simple password check for testing (password: Lagom192.)
    const isValid = password === 'Lagom192.'
    console.log('Auth Debug: Password check', { 
      isValid, 
      providedPasswordLength: password.length,
      expectedPasswordLength: 'Lagom192.'.length 
    })

    if (!isValid) {
      return null
    }
    return {
      email: username.includes('@') ? username : `${username}@pef.it`,
      name: username.split('@')[0],
    }
  }

  try {
    // Dynamic import of ldapts to avoid issues if not installed
    const { Client } = await import('ldapts')
    
    const client = new Client({
      url: LDAP_CONFIG.url,
    })

    // Bind with service account
    await client.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword)

    // Search for user
    const searchFilter = LDAP_CONFIG.searchFilter.replace('{{username}}', username)
    const { searchEntries } = await client.search(LDAP_CONFIG.searchBase, {
      scope: 'sub',
      filter: searchFilter,
    })

    if (searchEntries.length === 0) {
      await client.unbind()
      return null
    }

    const userEntry = searchEntries[0]
    const userDN = userEntry.dn

    // Authenticate user
    try {
      await client.bind(userDN, password)
      await client.unbind()

      return {
        email: (userEntry.mail || userEntry.email || `${username}@example.com`) as string,
        name: (userEntry.cn || userEntry.displayName || username) as string,
        ldapGroups: userEntry.memberOf as string[] | undefined,
      }
    } catch {
      await client.unbind()
      return null
    }
  } catch (error) {
    console.error('LDAP authentication error:', error)
    return null
  }
}

/**
 * Get or create user in database after LDAP authentication
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getOrCreateUser(email: string, _name: string) {
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      studentProfile: true,
      teacherProfile: true,
      coordinatorTutorProfile: true,
      collaboratorTutorProfile: true,
      department: true,
    },
  })

  if (!user) {
    // Create new user with default CORSISTA role
    // Admin can later assign proper role
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: '', // LDAP user, no local password
        role: 'CORSISTA',
        isActive: true,
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
        coordinatorTutorProfile: true,
        collaboratorTutorProfile: true,
        department: true,
      },
    })
  }

  return user
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Authenticate with LDAP
        const ldapUser = await authenticateWithLdap(
          credentials.username,
          credentials.password
        )

        if (!ldapUser) {
          return null
        }

        // Get or create user in database
        const user = await getOrCreateUser(ldapUser.email, ldapUser.name)

        if (!user.isActive) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: ldapUser.name,
          role: user.role as UserRole,
          departmentId: user.departmentId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
        token.departmentId = user.departmentId as string | null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.departmentId = token.departmentId as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
}
