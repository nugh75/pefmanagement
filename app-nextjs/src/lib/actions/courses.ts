'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation Schemas
const courseSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  cfu: z.coerce.number().min(1, "I CFU devono essere almeno 1"),
  departmentId: z.string().optional().nullable(), // uuid
})

export type CourseInput = z.infer<typeof courseSchema>

/**
 * Get all courses
 */
export async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    return { data: courses, error: null }
  } catch (error) {
    console.error('Error fetching courses:', error)
    return { data: null, error: 'Errore nel recupero degli insegnamenti' }
  }
}

/**
 * Create a new course
 */
export async function createCourse(data: CourseInput) {
  const result = courseSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Dati non validi' }
  }

  try {
    await prisma.course.create({
      data: result.data
    })

    revalidatePath('/dashboard/courses')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error creating course:', error)
    return { success: false, error: 'Errore nella creazione dell\'insegnamento' }
  }
}

/**
 * Update a course
 */
export async function updateCourse(id: string, data: CourseInput) {
  const result = courseSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Dati non validi' }
  }

  try {
    await prisma.course.update({
      where: { id },
      data: result.data
    })

    revalidatePath('/dashboard/courses')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating course:', error)
    return { success: false, error: 'Errore nell\'aggiornamento dell\'insegnamento' }
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string) {
  try {
    await prisma.course.delete({
      where: { id }
    })

    revalidatePath('/dashboard/courses')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting course:', error)
    return { success: false, error: 'Errore nell\'eliminazione dell\'insegnamento' }
  }
}

/**
 * Create bulk courses from CSV
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createBulkCourses(data: any[]) {
  try {
    // Basic validation of CSV structure
    // Expected: name, cfu, description, departmentCode (optional)
    
    // We can fetch departments to map codes if needed
    const departments = await prisma.department.findMany()
    const depMap = new Map(departments.map(d => [d.code, d.id]))
    // Also map by name just in case
    const depNameMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]))

    let successCount = 0

    // Use transaction for better atomicity or just strict parallel?
    // Bulk create usually wants all or nothing, but for UI CSV imports often "best effort" with report is preferred.
    // However, prisma .createMany is faster but strict.
    // Let's iterate to handle linking logic if needed.

    // Prepare data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validCourses: any[] = []

    for (const row of data) {
      if (!row.name || !row.cfu) {
        // Skip invalid rows
        continue
      }
      
      let departmentId = null
      if (row.departmentCode && depMap.has(row.departmentCode)) {
        departmentId = depMap.get(row.departmentCode)
      } else if (row.departmentName && depNameMap.has(row.departmentName.toLowerCase())) {
        departmentId = depNameMap.get(row.departmentName.toLowerCase())
      }

      validCourses.push({
        name: row.name,
        description: row.description || null,
        cfu: parseInt(row.cfu) || 0,
        departmentId: departmentId || null
      })
    }
    
    // Since we might have departmentId lookups, createMany works if we mapped IDs correctly.
    if (validCourses.length > 0) {
       await prisma.course.createMany({
         data: validCourses
       })
       successCount = validCourses.length
    }

    revalidatePath('/dashboard/courses')
    return { count: successCount, error: null }
  } catch (error) {
    console.error('Error creating bulk courses:', error)
    return { count: 0, error: 'Errore nell\'importazione massiva' }
  }
}
