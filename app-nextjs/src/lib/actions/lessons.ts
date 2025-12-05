'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation Schemas
const lessonSchema = z.object({
  courseId: z.string().min(1, "Insegnamento richiesto"),
  teacherId: z.string().min(1, "Docente richiesto"),
  lessonDate: z.coerce.date(),
  startTime: z.coerce.date(), // Time passed as Date object or string to be coerced
  endTime: z.coerce.date(),
  room: z.string().optional().nullable(),
  teamsMeetingLink: z.string().optional().nullable(),
  lessonCfu: z.coerce.number().min(0).default(0),
})

export type LessonInput = z.input<typeof lessonSchema>

export async function getLessons() {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        course: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        lessonDate: 'desc'
      }
    })
    return { data: lessons, error: null }
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return { data: null, error: 'Errore nel recupero delle lezioni' }
  }
}

export async function createLesson(data: LessonInput) {
  const result = lessonSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Dati non validi' }
  }

  try {
    await prisma.lesson.create({
      data: result.data
    })

    revalidatePath('/dashboard/lessons')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error creating lesson:', error)
    return { success: false, error: 'Errore nella creazione della lezione' }
  }
}

export async function updateLesson(id: string, data: LessonInput) {
  const result = lessonSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Dati non validi' }
  }

  try {
    await prisma.lesson.update({
      where: { id },
      data: result.data
    })

    revalidatePath('/dashboard/lessons')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating lesson:', error)
    return { success: false, error: 'Errore nell\'aggiornamento della lezione' }
  }
}

export async function deleteLesson(id: string) {
  try {
    await prisma.lesson.delete({
      where: { id }
    })

    revalidatePath('/dashboard/lessons')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return { success: false, error: 'Errore nell\'eliminazione della lezione' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createBulkLessons(data: any[]) {
  try {
    // Expected: courseName, teacherEmail, date (YYYY-MM-DD), startTime (HH:mm), endTime (HH:mm), room
    
    const courses = await prisma.course.findMany()
    const teachers = await prisma.teacherProfile.findMany({ include: { user: true } })

    const courseMap = new Map(courses.map(c => [c.name.toLowerCase(), c.id]))
    const teacherMap = new Map(teachers.map(t => [t.user.email.toLowerCase(), t.id]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validLessons: any[] = []

    for (const row of data) {
      if (!row.courseName || !row.teacherEmail || !row.date || !row.startTime || !row.endTime) {
        continue
      }

      const courseId = courseMap.get(row.courseName.toLowerCase())
      const teacherId = teacherMap.get(row.teacherEmail.toLowerCase())

      if (courseId && teacherId) {
        // Construct DateTime objects for start/end time
        // row.date is YYYY-MM-DD
        // row.startTime is HH:mm
        const dateStr = row.date
        const startDateTime = new Date(`${dateStr}T${row.startTime}:00`)
        const endDateTime = new Date(`${dateStr}T${row.endTime}:00`)
        
        validLessons.push({
          courseId,
          teacherId,
          lessonDate: new Date(dateStr),
          startTime: startDateTime,
          endTime: endDateTime,
          room: row.room || null,
          teamsMeetingLink: row.teamsMeetingLink || null,
          lessonCfu: parseFloat(row.lessonCfu) || 0
        })
      }
    }

    if (validLessons.length > 0) {
      await prisma.lesson.createMany({
        data: validLessons
      })
    }

    revalidatePath('/dashboard/lessons')
    return { count: validLessons.length, error: null }
  } catch (error) {
    console.error('Error creating bulk lessons:', error)
    return { count: 0, error: 'Errore nell\'importazione massiva' }
  }
}
