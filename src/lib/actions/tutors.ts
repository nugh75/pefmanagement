'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tutorSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email non valida'),
  departmentId: z.string().optional().nullable(),
  schoolId: z.string().optional().nullable(),
})

// Bulk Schemas
const bulkCoordinatorSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional().nullable(),
  departmentCode: z.string().optional().nullable(),
})

const bulkCollaboratorSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
})

export type TutorInput = z.input<typeof tutorSchema>
export type BulkCoordinatorInput = z.input<typeof bulkCoordinatorSchema>
export type BulkCollaboratorInput = z.input<typeof bulkCollaboratorSchema>

// Coordinator Actions
export async function getCoordinatorTutors() {
  try {
    const items = await prisma.coordinatorTutorProfile.findMany({
      orderBy: { lastName: 'asc' },
      include: {
        user: true,
        department: true,
      },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching coordinators:', error)
    return { data: null, error: 'Errore nel caricamento dei tutor coordinatori' }
  }
}

export async function createCoordinatorTutor(data: TutorInput) {
  try {
    const validated = tutorSchema.parse(data)
    
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } })

    if (existingUser) {
      const existingProfile = await prisma.coordinatorTutorProfile.findUnique({ where: { userId: existingUser.id } })
      if (existingProfile) return { data: null, error: 'Esiste già un profilo tutor coordinatore per questa email' }
      
      await prisma.coordinatorTutorProfile.create({
        data: {
          userId: existingUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          departmentId: validated.departmentId,
          phone: validated.phone,
        }
      })
      revalidatePath('/dashboard/tutors')
      return { error: null }
    }

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          role: 'COORD_TUTOR',
          passwordHash: '',
          isActive: true,
          departmentId: validated.departmentId,
        }
      })
      await tx.coordinatorTutorProfile.create({
        data: {
          userId: newUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          departmentId: validated.departmentId,
          phone: validated.phone,
        }
      })
    })

    revalidatePath('/dashboard/tutors')
    return { error: null }
  } catch (error) {
    console.error('Error creating coordinator:', error)
    return { error: 'Errore nella creazione del tutor coordinatore' }
  }
}

export async function updateCoordinatorTutor(id: string, data: TutorInput) {
  try {
    const validated = tutorSchema.parse(data)
    await prisma.coordinatorTutorProfile.update({
      where: { id },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        departmentId: validated.departmentId,
        phone: validated.phone,
      }
    })
    revalidatePath('/dashboard/tutors')
    return { error: null }
  } catch (error) {
    console.error('Error updating coordinator:', error)
    return { error: 'Errore nell\'aggiornamento del tutor' }
  }
}

export async function deleteCoordinatorTutor(id: string) {
  try {
    await prisma.coordinatorTutorProfile.delete({ where: { id } })
    revalidatePath('/dashboard/tutors')
    return { error: null }
  } catch (error) {
    console.error('Error deleting coordinator:', error)
    return { error: 'Impossibile eliminare il tutor' }
  }
}

// Bulk Create Coordinators
export async function createBulkCoordinatorTutors(data: BulkCoordinatorInput[]) {
  try {
    const validatedData = z.array(bulkCoordinatorSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      
      // Load departments map for code lookup
      const departments = await tx.department.findMany()
      const deptMap = new Map(departments.map(d => [d.code, d.id]))

      for (const item of validatedData) {
        let departmentId: string | null = null
        if (item.departmentCode) {
          departmentId = deptMap.get(item.departmentCode) || null
        }

        let userId: string
        const existingUser = await tx.user.findUnique({
          where: { email: item.email }
        })

        if (existingUser) {
          userId = existingUser.id
        } else {
          const newUser = await tx.user.create({
            data: {
              email: item.email,
              role: 'COORD_TUTOR',
              passwordHash: '',
              isActive: true,
              departmentId,
            }
          })
          userId = newUser.id
        }

        const existingProfile = await tx.coordinatorTutorProfile.findUnique({
          where: { userId }
        })

        if (!existingProfile) {
          await tx.coordinatorTutorProfile.create({
            data: {
              userId,
              firstName: item.firstName,
              lastName: item.lastName,
              departmentId,
              phone: item.phone,
            }
          })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/tutors')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating coordinators:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}

// Collaborator Actions
export async function getCollaboratorTutors() {
  try {
    const items = await prisma.collaboratorTutorProfile.findMany({
      orderBy: { lastName: 'asc' },
      include: {
        user: true,
        school: true,
      },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return { data: null, error: 'Errore nel caricamento dei tutor collaboratori' }
  }
}

export async function createCollaboratorTutor(data: TutorInput) {
  try {
    const validated = tutorSchema.parse(data)
    
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } })

    if (existingUser) {
      const existingProfile = await prisma.collaboratorTutorProfile.findUnique({ where: { userId: existingUser.id } })
      if (existingProfile) return { data: null, error: 'Esiste già un profilo tutor collaboratore per questa email' }
      
      await prisma.collaboratorTutorProfile.create({
        data: {
          userId: existingUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          schoolId: validated.schoolId,
          phone: validated.phone,
        }
      })
      revalidatePath('/dashboard/tutors')
      return { error: null }
    }

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          role: 'COLLAB_TUTOR',
          passwordHash: '',
          isActive: true,
        }
      })
      await tx.collaboratorTutorProfile.create({
        data: {
          userId: newUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          schoolId: validated.schoolId,
          phone: validated.phone,
        }
      })
    })

    revalidatePath('/dashboard/tutors')
    return { error: null }
  } catch (error) {
    console.error('Error creating collaborator:', error)
    return { error: 'Errore nella creazione del tutor collaboratore' }
  }
}

export async function updateCollaboratorTutor(id: string, data: TutorInput) {
  try {
    const validated = tutorSchema.parse(data)
    await prisma.collaboratorTutorProfile.update({
      where: { id },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        schoolId: validated.schoolId,
        phone: validated.phone,
      }
    })
    revalidatePath('/dashboard/tutors')
    return { error: null }
  } catch (error) {
    console.error('Error updating collaborator:', error)
    return { error: 'Errore nell\'aggiornamento del tutor' }
  }
}

export async function deleteCollaboratorTutor(id: string) {
  try {
    await prisma.collaboratorTutorProfile.delete({ where: { id } })
    revalidatePath('/dashboard/tutors')
    return { error: null }
  } catch (error) {
    console.error('Error deleting collaborator:', error)
    return { error: 'Impossibile eliminare il tutor' }
  }
}

// Bulk Create Collaborators
export async function createBulkCollaboratorTutors(data: BulkCollaboratorInput[]) {
  try {
    const validatedData = z.array(bulkCollaboratorSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      
      // Load schools map for name lookup
      const schools = await tx.school.findMany()
      const schoolMap = new Map(schools.map(s => [s.name.trim().toLowerCase(), s.id]))

      for (const item of validatedData) {
        let schoolId: string | null = null
        if (item.schoolName) {
          schoolId = schoolMap.get(item.schoolName.trim().toLowerCase()) || null
        }

        let userId: string
        const existingUser = await tx.user.findUnique({
          where: { email: item.email }
        })

        if (existingUser) {
          userId = existingUser.id
        } else {
          const newUser = await tx.user.create({
            data: {
              email: item.email,
              role: 'COLLAB_TUTOR',
              passwordHash: '',
              isActive: true,
            }
          })
          userId = newUser.id
        }

        const existingProfile = await tx.collaboratorTutorProfile.findUnique({
          where: { userId }
        })

        if (!existingProfile) {
          await tx.collaboratorTutorProfile.create({
            data: {
              userId,
              firstName: item.firstName,
              lastName: item.lastName,
              schoolId,
              phone: item.phone,
            }
          })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/tutors')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating collaborators:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}
