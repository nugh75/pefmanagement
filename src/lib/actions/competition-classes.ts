'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const competitionClassSchema = z.object({
  code: z.string().min(1, 'Codice richiesto (es. A-01)'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional().nullable(),
})

export type CompetitionClassFormData = z.infer<typeof competitionClassSchema>

// Get all
export async function getCompetitionClasses() {
  try {
    const items = await prisma.competitionClass.findMany({
      orderBy: { code: 'asc' },
    })
    return { data: items, error: null }
  } catch (error) {
    console.error('Error fetching competition classes:', error)
    return { data: null, error: 'Errore nel caricamento delle classi di concorso' }
  }
}

// Create
export async function createCompetitionClass(data: CompetitionClassFormData) {
  try {
    const validated = competitionClassSchema.parse(data)
    
    // Check for duplicates
    const existing = await prisma.competitionClass.findUnique({
      where: { code: validated.code }
    })

    if (existing) {
      return { data: null, error: 'Esiste già una classe di concorso con questo codice' }
    }

    const item = await prisma.competitionClass.create({
      data: validated,
    })
    
    revalidatePath('/dashboard/competition-classes')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating competition class:', error)
    return { data: null, error: 'Errore nella creazione della classe di concorso' }
  }
}

// Update
export async function updateCompetitionClass(id: string, data: CompetitionClassFormData) {
  try {
    const validated = competitionClassSchema.parse(data)
    
    const item = await prisma.competitionClass.update({
      where: { id },
      data: validated,
    })
    
    revalidatePath('/dashboard/competition-classes')
    return { data: item, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating competition class:', error)
    return { data: null, error: 'Errore nell\'aggiornamento della classe di concorso' }
  }
}

// Delete
export async function deleteCompetitionClass(id: string) {
  try {
    await prisma.competitionClass.delete({
      where: { id },
    })
    revalidatePath('/dashboard/competition-classes')
    return { error: null }
  } catch (error) {
    console.error('Error deleting competition class:', error)
    return { error: 'Impossibile eliminare: la classe di concorso è associata ad altri dati' }
  }
}

// Bulk Create
export async function createBulkCompetitionClasses(data: CompetitionClassFormData[]) {
  try {
    const validatedData = z.array(competitionClassSchema).parse(data)

    const result = await prisma.$transaction(async (tx) => {
      let count = 0
      for (const item of validatedData) {
        const existing = await tx.competitionClass.findUnique({
          where: { code: item.code }
        })
        if (!existing) {
          await tx.competitionClass.create({ data: item })
          count++
        }
      }
      return count
    })

    revalidatePath('/dashboard/competition-classes')
    return { count: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { count: 0, error: `Errore di validazione: ${error.issues[0].message}` }
    }
    console.error('Error bulk creating competition classes:', error)
    return { count: 0, error: 'Errore durante l\'importazione massiva' }
  }
}
