'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const schoolSchema = z.object({
  name: z.string().min(1, 'Nome scuola richiesto'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
})

export type SchoolFormData = z.infer<typeof schoolSchema>

// Get all
export async function getSchools() {
  try {
    const items = await prisma.school.findMany({
      orderBy: { name: 'asc' },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching schools:', error)
    return { data: null, error: 'Errore nel caricamento degli istituti scolastici' }
  }
}

// Create
export async function createSchool(data: SchoolFormData) {
  try {
    const validated = schoolSchema.parse(data)
    
    // Create new. No unique constraint in DB on name/city yet to check against.
    const item = await prisma.school.create({
      data: validated,
    })
    
    revalidatePath('/dashboard/schools')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating school:', error)
    return { data: null, error: 'Errore nella creazione dell\'istituto scolastico' }
  }
}

// Update
export async function updateSchool(id: string, data: SchoolFormData) {
  try {
    const validated = schoolSchema.parse(data)
    
    const item = await prisma.school.update({
      where: { id },
      data: validated,
    })
    
    revalidatePath('/dashboard/schools')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating school:', error)
    return { data: null, error: 'Errore nell\'aggiornamento dell\'istituto scolastico' }
  }
}

// Delete
export async function deleteSchool(id: string) {
  try {
    await prisma.school.delete({
      where: { id },
    })
    revalidatePath('/dashboard/schools')
    return { error: null }
  } catch (error) {
    console.error('Error deleting school:', error)
    return { error: 'Impossibile eliminare: l\'istituto è associato ad altri dati (es. tirocini)' }
  }
}

// Bulk Create
export async function createBulkSchools(data: SchoolFormData[]) {
  try {
    const validatedData = z.array(schoolSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      for (const item of validatedData) {
        // Simple check: if exact name exists in same city, skip?
        // Or just create always?
        // Let's create always unless exact match on name+city+address
        
        // Optimistic: just create.
        await tx.school.create({ data: item })
        count++
      }
      return count
    })

    revalidatePath('/dashboard/schools')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating schools:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}
