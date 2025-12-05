'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isValidRole } from '@/types/roles'

// Validation schema
const userSchema = z.object({
  email: z.string().email('Email non valida'),
  role: z.string().refine(isValidRole, {
    message: 'Ruolo non valido',
  }),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

const bulkUserSchema = z.object({
  email: z.string().email('Email non valida'),
  role: z.string().refine(isValidRole, {
    message: 'Ruolo non valido',
  }),
  departmentCode: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type UserFormData = z.infer<typeof userSchema>
export type BulkUserInput = z.input<typeof bulkUserSchema>

// Get all users
export async function getUsers() {
  try {
    const items = await prisma.user.findMany({
      orderBy: { email: 'asc' },
      include: {
        department: true,
      },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { data: null, error: 'Errore nel caricamento degli utenti' }
  }
}

// Create
export async function createUser(data: UserFormData) {
  try {
    const validated = userSchema.parse(data)
    
    // Check for duplicates
    const existing = await prisma.user.findUnique({
      where: { email: validated.email }
    })

    if (existing) {
      return { data: null, error: 'Esiste già un utente con questa email' }
    }

    // Role specific validation: Department IS required for DIPARTIMENTO role (optional, but good practice)
    if (validated.role === 'DIPARTIMENTO' && !validated.departmentId) {
      return { data: null, error: 'Il ruolo DIPARTIMENTO richiede la selezione di un dipartimento' }
    }

    const item = await prisma.user.create({
      data: {
        ...validated,
        passwordHash: '', // Managed by LDAP
      },
      include: {
        department: true,
      }
    })
    
    revalidatePath('/dashboard/users')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating user:', error)
    return { data: null, error: 'Errore nella creazione dell\'utente' }
  }
}

// Update
export async function updateUser(id: string, data: UserFormData) {
  try {
    const validated = userSchema.parse(data)
    
    if (validated.role === 'DIPARTIMENTO' && !validated.departmentId) {
      return { data: null, error: 'Il ruolo DIPARTIMENTO richiede la selezione di un dipartimento' }
    }

    const item = await prisma.user.update({
      where: { id },
      data: validated,
      include: {
        department: true,
      }
    })
    
    revalidatePath('/dashboard/users')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating user:', error)
    return { data: null, error: 'Errore nell\'aggiornamento dell\'utente' }
  }
}

// Delete
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    })
    revalidatePath('/dashboard/users')
    return { error: null }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { error: 'Impossibile eliminare l\'utente (probabilmente ha dati collegati)' }
  }
}

// Bulk Create
export async function createBulkUsers(data: BulkUserInput[]) {
  try {
    const validatedData = z.array(bulkUserSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      
      const departments = await tx.department.findMany()
      const deptMap = new Map(departments.map(d => [d.code, d.id]))

      for (const item of validatedData) {
        let departmentId: string | null = null
        if (item.departmentCode) {
          departmentId = deptMap.get(item.departmentCode) || null
        }

        if (item.role === 'DIPARTIMENTO' && !departmentId) {
           // Skip or error? Error better for clarity in bulk? Or skip?
           // Validation error.
           throw new Error(`Dip. Code non valido per ruolo DIPARTIMENTO: ${item.departmentCode}`)
        }

        const existing = await tx.user.findUnique({
          where: { email: item.email }
        })

        if (!existing) {
          await tx.user.create({
            data: {
              email: item.email,
              role: item.role,
              departmentId,
              isActive: item.isActive,
              passwordHash: '',
            }
          })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/users')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating users:', error)
    return { count: 0, error: error instanceof Error ? error.message : 'Errore durante l\'importazione massiva' }
  }
}
