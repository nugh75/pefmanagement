'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const teacherProfileSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  departmentId: z.string().optional().nullable(),
  competitionClassId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email non valida'),
})

// Bulk schema allows codes instead of IDs for easier CSV import
const bulkTeacherSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional().nullable(),
  departmentCode: z.string().optional().nullable(), // For lookup
  competitionClassCode: z.string().optional().nullable(), // For lookup
})

export type TeacherProfileInput = z.input<typeof teacherProfileSchema>
export type BulkTeacherInput = z.input<typeof bulkTeacherSchema>

export async function getTeacherProfiles() {
  try {
    const items = await prisma.teacherProfile.findMany({
      orderBy: { lastName: 'asc' },
      include: {
        user: true,
        department: true,
        competitionClass: true,
      },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return { data: null, error: 'Errore nel caricamento dei docenti' }
  }
}

export async function createTeacherProfile(data: TeacherProfileInput) {
  try {
    const validated = teacherProfileSchema.parse(data)
    
    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })

    if (existingUser) {
      // Check for existing profile
      const existingProfile = await prisma.teacherProfile.findUnique({
        where: { userId: existingUser.id }
      })
      if (existingProfile) {
        return { data: null, error: 'Esiste già un profilo docente per questa email' }
      }
      
      const newProfile = await prisma.teacherProfile.create({
        data: {
          userId: existingUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          departmentId: validated.departmentId,
          competitionClassId: validated.competitionClassId,
          phone: validated.phone,
        },
        include: { user: true }
      })
      
      revalidatePath('/dashboard/teachers')
      return { data: newProfile, error: null }
    }

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          role: 'DOCENTE',
          passwordHash: '',
          isActive: true,
          departmentId: validated.departmentId,
        }
      })

      const newProfile = await tx.teacherProfile.create({
        data: {
          userId: newUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          departmentId: validated.departmentId,
          competitionClassId: validated.competitionClassId,
          phone: validated.phone,
        },
        include: { user: true }
      })
      return newProfile
    })

    revalidatePath('/dashboard/teachers')
    return { data: result, error: null }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating teacher:', error)
    return { data: null, error: 'Errore nella creazione del docente' }
  }
}

export async function updateTeacherProfile(id: string, data: TeacherProfileInput) {
  try {
    const validated = teacherProfileSchema.parse(data)
    
    const item = await prisma.teacherProfile.update({
      where: { id },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        departmentId: validated.departmentId,
        competitionClassId: validated.competitionClassId,
        phone: validated.phone,
      },
      include: {
        user: true,
      }
    })
    
    revalidatePath('/dashboard/teachers')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating teacher:', error)
    return { data: null, error: 'Errore nell\'aggiornamento del docente' }
  }
}

export async function deleteTeacherProfile(id: string) {
  try {
    await prisma.teacherProfile.delete({
      where: { id },
    })
    revalidatePath('/dashboard/teachers')
    return { error: null }
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return { error: 'Impossibile eliminare il profilo docente' }
  }
}

// Bulk Create
export async function createBulkTeacherProfiles(data: BulkTeacherInput[]) {
  try {
    const validatedData = z.array(bulkTeacherSchema).parse(data)

    // Pre-fetch departments and competition classes maps for faster lookup could be done here,
    // but code-based lookup inside transaction is safer for now.
    
    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      
      // Cache lookup maps
      const departments = await tx.department.findMany()
      const compClasses = await tx.competitionClass.findMany()

      const deptMap = new Map(departments.map(d => [d.code, d.id]))
      // Also map by name if needed? Let's stick to Code first. If code missing, maybe try name?
      // Or just code. The schema says Code for bulk input.

      const compClassMap = new Map(compClasses.map(c => [c.code, c.id]))

      for (const item of validatedData) {
        // Resolve Department by Code
        let departmentId: string | null = null
        if (item.departmentCode) {
           departmentId = deptMap.get(item.departmentCode) || null
           if (!departmentId) {
             // Fallback: try finding by name if code lookup failed and code looks like it might be a name?
             // Or just log warning?
             // For now, if code not found, departmentId remains null.
           }
        }

        // Resolve Competition Class by Code
        let competitionClassId: string | null = null
        if (item.competitionClassCode) {
           competitionClassId = compClassMap.get(item.competitionClassCode) || null
        }

        // Handle User Logic
        let userId: string
        const existingUser = await tx.user.findUnique({
          where: { email: item.email }
        })

        if (existingUser) {
          userId = existingUser.id
          // Maybe update user role? Or just trust existing.
        } else {
          const newUser = await tx.user.create({
            data: {
              email: item.email,
              role: 'DOCENTE',
              passwordHash: '',
              isActive: true,
              departmentId, // Link user just in case
            }
          })
          userId = newUser.id
        }

        const existingProfile = await tx.teacherProfile.findUnique({
          where: { userId }
        })

        if (!existingProfile) {
          await tx.teacherProfile.create({
            data: {
              userId,
              firstName: item.firstName,
              lastName: item.lastName,
              departmentId,
              competitionClassId,
              phone: item.phone,
            }
          })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/teachers')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating teachers:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}
