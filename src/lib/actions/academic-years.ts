'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const academicYearSchema = z.object({
  yearLabel: z.string().min(1, 'Anno Accademico richiesto (es. 2024/2025)'),
  editionLabel: z.string().min(1, 'Edizione richiesta (es. I, II, III)'),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  description: z.string().optional().nullable(),
})

export type AcademicYearInput = z.input<typeof academicYearSchema>
export type AcademicYearFormData = z.infer<typeof academicYearSchema>

// Get all academic years
export async function getAcademicYears() {
  try {
    const items = await prisma.academicYearEdition.findMany({
      orderBy: [
        { startDate: 'desc' },
      ],
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching academic years:', error)
    return { data: null, error: 'Errore nel caricamento degli anni accademici' }
  }
}

// Create
export async function createAcademicYear(data: AcademicYearInput) {
  try {
    const validated = academicYearSchema.parse(data)
    
    // Check for duplicates
    const existing = await prisma.academicYearEdition.findUnique({
      where: {
        yearLabel_editionLabel: {
          yearLabel: validated.yearLabel,
          editionLabel: validated.editionLabel,
        }
      }
    })

    if (existing) {
      return { data: null, error: 'Esiste già una edizione per questo anno accademico' }
    }

    const item = await prisma.academicYearEdition.create({
      data: validated,
    })
    
    revalidatePath('/dashboard/academic-years')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating academic year:', error)
    return { data: null, error: 'Errore nella creazione dell\'anno accademico' }
  }
}

// Update
export async function updateAcademicYear(id: string, data: AcademicYearInput) {
  try {
    const validated = academicYearSchema.parse(data)
    
    const item = await prisma.academicYearEdition.update({
      where: { id },
      data: validated,
    })
    
    revalidatePath('/dashboard/academic-years')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    // Check unique constraint violation code (P2002) if needed, usually generic error is enough for UI
    console.error('Error updating academic year:', error)
    return { data: null, error: 'Errore nell\'aggiornamento dell\'anno accademico' }
  }
}

// Delete
export async function deleteAcademicYear(id: string) {
  try {
    await prisma.academicYearEdition.delete({
      where: { id },
    })
    revalidatePath('/dashboard/academic-years')
    return { error: null }
  } catch (error) {
    console.error('Error deleting academic year:', error)
    return { error: 'Impossibile eliminare: l\'anno accademico è associato ad altri elementi' }
  }
}

// Bulk Create
export async function createBulkAcademicYears(data: AcademicYearInput[]) {
  try {
    const validatedData = z.array(academicYearSchema).parse(data)

    // Check for duplicates within the input data itself
    const uniqueKeys = new Set()
    for (const item of validatedData) {
      const key = `${item.yearLabel}-${item.editionLabel}`
      if (uniqueKeys.has(key)) {
        return { count: 0, error: `Duplicati nel file di importazione: Anno ${item.yearLabel} Edizione ${item.editionLabel}` }
      }
      uniqueKeys.add(key)
    }

    // Transactional Create
    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      for (const item of validatedData) {
        // Check DB duplicates
        const existing = await tx.academicYearEdition.findUnique({
          where: {
            yearLabel_editionLabel: {
              yearLabel: item.yearLabel,
              editionLabel: item.editionLabel,
            }
          }
        })

        if (existing) {
          throw new Error(`Esiste già una edizione per ${item.yearLabel} - ${item.editionLabel}`)
        }

        await tx.academicYearEdition.create({
          data: item,
        })
        count++
      }
      return count
    })

    revalidatePath('/dashboard/academic-years')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message} (alla riga/elemento ${String(error.issues[0].path[0] || 'sconosciuto')})` }
    }
    console.error('Error bulk creating academic years:', error)
    return { count: 0, error: error instanceof Error ? error.message : 'Errore durante l\'importazione massiva' }
  }
}
