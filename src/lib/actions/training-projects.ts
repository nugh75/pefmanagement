'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const trainingProjectSchema = z.object({
  studentId: z.string().min(1, "Corsista richiesto"),
  courseTypeId: z.string().min(1, "Tipo Percorso richiesto"),
  academicYearEditionId: z.string().min(1, "Anno Accademico richiesto"),
  departmentId: z.string().min(1, "Dipartimento richiesto"),
  status: z.enum(['In_Corso', 'Completato', 'Sospeso', 'Annullato']).default('In_Corso'),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
})

export type TrainingProjectInput = z.input<typeof trainingProjectSchema>

export async function getTrainingProjects() {
  try {
    const projects = await prisma.trainingProject.findMany({
      include: {
        student: { include: { user: true } },
        courseType: true,
        academicYearEdition: true,
        department: true,
      },
      orderBy: {
        student: { lastName: 'asc' }
      }
    })
    return { data: projects, error: null }
  } catch (error) {
    console.error('Error fetching training projects:', error)
    return { data: null, error: 'Errore nel recupero dei progetti formativi' }
  }
}

export async function createTrainingProject(data: TrainingProjectInput) {
  const result = trainingProjectSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Dati non validi' }
  }

  try {
    await prisma.trainingProject.create({
      data: {
        ...result.data,
        startDate: result.data.startDate || null,
        endDate: result.data.endDate || null,
      }
    })

    revalidatePath('/dashboard/training-projects')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error creating training project:', error)
    return { success: false, error: 'Errore nella creazione del progetto formativo' }
  }
}

export async function updateTrainingProject(id: string, data: TrainingProjectInput) {
  const result = trainingProjectSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Dati non validi' }
  }

  try {
    await prisma.trainingProject.update({
      where: { id },
      data: {
        ...result.data,
        startDate: result.data.startDate || null,
        endDate: result.data.endDate || null,
      }
    })

    revalidatePath('/dashboard/training-projects')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating training project:', error)
    return { success: false, error: 'Errore nell\'aggiornamento del progetto formativo' }
  }
}

export async function deleteTrainingProject(id: string) {
  try {
    await prisma.trainingProject.delete({
      where: { id }
    })

    revalidatePath('/dashboard/training-projects')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting training project:', error)
    return { success: false, error: 'Errore nell\'eliminazione del progetto formativo' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createBulkTrainingProjects(data: any[]) {
  try {
    // Expected CSV columns:
    // studentFiscalCode, courseTypeName, academicYearLabel, departmentCode, status(optional), startDate(optional), endDate(optional)

    const students = await prisma.studentProfile.findMany()
    const courseTypes = await prisma.courseType.findMany()
    const academicYears = await prisma.academicYearEdition.findMany()
    const departments = await prisma.department.findMany()

    const studentMap = new Map(students.map(s => [s.fiscalCode.toUpperCase(), s.id]))
    const courseTypeMap = new Map(courseTypes.map(c => [c.name.toLowerCase(), c.id]))
    // Composite key for years might be safer, but user will likely provide a single "yearLabel" or "editionLabel" or a combination?
    // Let's assume CSV provides "yearLabel" (e.g. 2023/2024) and we pick the first edition or assume unique year labels which is mostly true.
    // Actually AcademicYearEdition has unique [yearLabel, editionLabel].
    // Let's try to match on `yearLabel` assuming edition is default or provided.
    // Map key: yearLabel.toLowerCase() -> id
    const yearMap = new Map(academicYears.map(y => [y.yearLabel.toLowerCase(), y.id]))

    const departmentMap = new Map(departments.map(d => [d.code?.toLowerCase() || d.name.toLowerCase(), d.id]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validProjects: any[] = []

    for (const row of data) {
      if (!row.studentFiscalCode || !row.courseTypeName || !row.academicYearLabel || !row.departmentCode) {
        continue
      }

      const studentId = studentMap.get(row.studentFiscalCode.toUpperCase())
      const courseTypeId = courseTypeMap.get(row.courseTypeName.toLowerCase())
      const academicYearEditionId = yearMap.get(row.academicYearLabel.toLowerCase())
      const departmentId = departmentMap.get(row.departmentCode.toLowerCase())

      if (studentId && courseTypeId && academicYearEditionId && departmentId) {
        validProjects.push({
          studentId,
          courseTypeId,
          academicYearEditionId,
          departmentId,
          status: row.status || 'In_Corso',
          startDate: row.startDate ? new Date(row.startDate) : null,
          endDate: row.endDate ? new Date(row.endDate) : null
        })
      }
    }

    if (validProjects.length > 0) {
      await prisma.trainingProject.createMany({
        data: validProjects,
        skipDuplicates: true // Avoid failing on duplicate unique constraints
      })
    }
    
    revalidatePath('/dashboard/training-projects')
    return { count: validProjects.length, error: null }

  } catch (error) {
    console.error('Error creating bulk training projects:', error)
    return { count: 0, error: 'Errore nell\'importazione massiva' }
  }
}
