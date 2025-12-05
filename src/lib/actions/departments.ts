'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const departmentSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export type DepartmentFormData = z.infer<typeof departmentSchema>

// Get all departments
export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    })
    return { data: departments, error: null }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return { data: null, error: 'Errore nel caricamento dei dipartimenti' }
  }
}

// Get single department
export async function getDepartment(id: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
    })
    return { data: department, error: null }
  } catch (error) {
    console.error('Error fetching department:', error)
    return { data: null, error: 'Errore nel caricamento del dipartimento' }
  }
}

// Create department
export async function createDepartment(data: DepartmentFormData) {
  try {
    const validated = departmentSchema.parse(data)
    const department = await prisma.department.create({
      data: validated,
    })
    revalidatePath('/dashboard/departments')
    return { data: department, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error creating department:', error)
    return { data: null, error: 'Errore nella creazione del dipartimento' }
  }
}

// Update department
export async function updateDepartment(id: string, data: DepartmentFormData) {
  try {
    const validated = departmentSchema.parse(data)
    const department = await prisma.department.update({
      where: { id },
      data: validated,
    })
    revalidatePath('/dashboard/departments')
    return { data: department, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0].message }
    }
    console.error('Error updating department:', error)
    return { data: null, error: 'Errore nell\'aggiornamento del dipartimento' }
  }
}

// Delete department
export async function deleteDepartment(id: string) {
  try {
    await prisma.department.delete({
      where: { id },
    })
    revalidatePath('/dashboard/departments')
    return { error: null }
  } catch (error) {
    console.error('Error deleting department:', error)
    return { error: 'Errore nell\'eliminazione del dipartimento' }
  }
}
