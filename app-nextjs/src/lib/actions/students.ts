'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const studentProfileSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  fiscalCode: z.string().length(16, 'Codice Fiscale deve essere di 16 caratteri'),
  dateOfBirth: z.coerce.date().optional().nullable(), // Allow string coercion
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email non valida'),
})

export type StudentProfileInput = z.input<typeof studentProfileSchema>
export type StudentProfileFormData = z.infer<typeof studentProfileSchema>

// Get all students
export async function getStudentProfiles() {
  try {
    const items = await prisma.studentProfile.findMany({
      orderBy: { lastName: 'asc' },
      include: {
        user: true,
      },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching students:', error)
    return { data: null, error: 'Errore nel caricamento dei corsisti' }
  }
}

// Create Student (and User)
export async function createStudentProfile(data: StudentProfileInput) {
  try {
    const validated = studentProfileSchema.parse(data)
    
    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })

    if (existingUser) {
      // Check if user already has a student profile
      const existingProfile = await prisma.studentProfile.findUnique({
        where: { userId: existingUser.id }
      })
      if (existingProfile) {
        return { data: null, error: 'Esiste già un profilo corsista per questa email' }
      }
      
      // Create profile for existing user
      const newProfile = await prisma.studentProfile.create({
        data: {
          userId: existingUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          fiscalCode: validated.fiscalCode,
          dateOfBirth: validated.dateOfBirth,
          address: validated.address,
          city: validated.city,
          phone: validated.phone,
        },
        include: { user: true }
      })
      
      revalidatePath('/dashboard/students')
      return { data: newProfile, error: null }
    }

    // Create NEW User and Profile transactionally
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          role: 'CORSISTA',
          passwordHash: '',
          isActive: true,
        }
      })

      const newProfile = await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          fiscalCode: validated.fiscalCode,
          dateOfBirth: validated.dateOfBirth,
          address: validated.address,
          city: validated.city,
          phone: validated.phone,
        },
        include: { user: true }
      })
      return newProfile
    })

    revalidatePath('/dashboard/students')
    return { data: result, error: null }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating student:', error)
    return { data: null, error: 'Errore nella creazione del corsista' }
  }
}

// Update
export async function updateStudentProfile(id: string, data: StudentProfileInput) {
  try {
    const validated = studentProfileSchema.parse(data)
    
    const item = await prisma.studentProfile.update({
      where: { id },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        fiscalCode: validated.fiscalCode,
        dateOfBirth: validated.dateOfBirth,
        address: validated.address,
        city: validated.city,
        phone: validated.phone,
      },
      include: {
        user: true,
      }
    })
    
    revalidatePath('/dashboard/students')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating student:', error)
    return { data: null, error: 'Errore nell\'aggiornamento del corsista' }
  }
}

// Delete
export async function deleteStudentProfile(id: string) {
  try {
    await prisma.studentProfile.delete({
      where: { id },
    })
    revalidatePath('/dashboard/students')
    return { error: null }
  } catch (error) {
    console.error('Error deleting student:', error)
    return { error: 'Impossibile eliminare il profilo corsista' }
  }
}

// Bulk Create
export async function createBulkStudentProfiles(data: StudentProfileInput[]) {
  try {
    // Validate all data first
    // Use z.coerce.date in schema to handle CSV date strings
    const validatedData = z.array(studentProfileSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      for (const item of validatedData) {
        // Find existing user by email
        let userId: string

        const existingUser = await tx.user.findUnique({
          where: { email: item.email }
        })

        if (existingUser) {
          userId = existingUser.id
        } else {
          // Create user
          const newUser = await tx.user.create({
            data: {
              email: item.email,
              role: 'CORSISTA',
              passwordHash: '', // Set default or handle password reset later
              isActive: true,
            }
          })
          userId = newUser.id
        }

        // Check if profile exists for this user
        const existingProfile = await tx.studentProfile.findUnique({
          where: { userId }
        })

        if (!existingProfile) {
          await tx.studentProfile.create({
            data: {
              userId,
              firstName: item.firstName,
              lastName: item.lastName,
              fiscalCode: item.fiscalCode,
              dateOfBirth: item.dateOfBirth,
              address: item.address,
              city: item.city,
              phone: item.phone,
            }
          })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/students')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating students:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}
