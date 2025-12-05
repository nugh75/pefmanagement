'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const courseTypeSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional().nullable(),
  hasInItinereExams: z.boolean().default(false),
})

export type CourseTypeFormData = z.infer<typeof courseTypeSchema>

// Get all
export async function getCourseTypes() {
  try {
    const items = await prisma.courseType.findMany({
      orderBy: { name: 'asc' },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching course types:', error)
    return { data: null, error: 'Errore nel caricamento delle tipologie percorso' }
  }
}

// Create
export async function createCourseType(data: CourseTypeFormData) {
  try {
    const validated = courseTypeSchema.parse(data)
    
    // Check for duplicates
    const existing = await prisma.courseType.findUnique({
      where: { name: validated.name }
    })

    if (existing) {
      return { data: null, error: 'Esiste già una tipologia con questo nome' }
    }

    const item = await prisma.courseType.create({
      data: validated,
    })
    
    revalidatePath('/dashboard/course-types')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating course type:', error)
    return { data: null, error: 'Errore nella creazione della tipologia percorso' }
  }
}

// Update
export async function updateCourseType(id: string, data: CourseTypeFormData) {
  try {
    const validated = courseTypeSchema.parse(data)
    
    const item = await prisma.courseType.update({
      where: { id },
      data: validated,
    })
    
    revalidatePath('/dashboard/course-types')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating course type:', error)
    return { data: null, error: 'Errore nell\'aggiornamento della tipologia percorso' }
  }
}

// Delete
export async function deleteCourseType(id: string) {
  try {
    await prisma.courseType.delete({
      where: { id },
    })
    revalidatePath('/dashboard/course-types')
    return { error: null }
  } catch (error) {
    console.error('Error deleting course type:', error)
    return { error: 'Impossibile eliminare: elemento associato ad altri dati' }
  }
}

// Bulk Create
export async function createBulkCourseTypes(data: CourseTypeFormData[]) {
  try {
    // Flexible schema to handle potential string-boolean conversions from CSV
    const bulkSchema = z.object({
      name: z.string().min(1, 'Nome richiesto'),
      description: z.string().optional().nullable(),
      hasInItinereExams: z.union([z.boolean(), z.string()]).transform((val) => {
        if (typeof val === 'boolean') return val;
        // Basic true/false string checking
        const s = String(val).toLowerCase();
        return s === 'true' || s === '1' || s === 'sì' || s === 'si' || s === 'yes';
      }),
    })

    const validatedData = z.array(bulkSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      for (const item of validatedData) {
        const existing = await tx.courseType.findUnique({
          where: { name: item.name }
        })
        if (!existing) {
          await tx.courseType.create({ data: item })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/course-types')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating course types:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}
