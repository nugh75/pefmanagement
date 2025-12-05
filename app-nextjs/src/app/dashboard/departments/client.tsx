'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Pencil, Trash2 } from 'lucide-react'
import { Department } from '@prisma/client'

import { DataTable, SortableHeader } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { labels } from '@/lib/labels'
import { createDepartment, updateDepartment, deleteDepartment, DepartmentFormData } from '@/lib/actions/departments'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  code: z.string().optional(),
  description: z.string().optional(),
})

interface DepartmentsClientProps {
  departments: Department[]
  error: string | null
}

export function DepartmentsClient({ departments, error }: DepartmentsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
  })

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title={labels.departments.name} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.getValue('name')}</p>
            {row.original.code && (
              <p className="text-sm text-slate-500">{row.original.code}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: labels.departments.code,
      cell: ({ row }) => (
        row.getValue('code') ? (
          <Badge variant="secondary">{row.getValue('code')}</Badge>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      accessorKey: 'description',
      header: labels.departments.description,
      cell: ({ row }) => (
        <p className="text-slate-600 truncate max-w-xs">
          {row.getValue('description') || '-'}
        </p>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteClick(row.original)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const handleAdd = () => {
    setSelectedDepartment(null)
    form.reset({ name: '', code: '', description: '' })
    setIsDialogOpen(true)
  }

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department)
    form.reset({
      name: department.name,
      code: department.code || '',
      description: department.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedDepartment) return
    
    setIsLoading(true)
    const result = await deleteDepartment(selectedDepartment.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Dipartimento eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    const result = selectedDepartment
      ? await updateDepartment(selectedDepartment.id, values as DepartmentFormData)
      : await createDepartment(values as DepartmentFormData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedDepartment ? 'Dipartimento aggiornato' : 'Dipartimento creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={departments}
        title={labels.departments._title}
        description="Gestione dei dipartimenti universitari"
        searchPlaceholder="Cerca dipartimento..."
        searchColumn="name"
        onAdd={handleAdd}
        addLabel="Nuovo Dipartimento"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment ? 'Modifica Dipartimento' : 'Nuovo Dipartimento'}
            </DialogTitle>
            <DialogDescription>
              {selectedDepartment
                ? 'Modifica i dati del dipartimento'
                : 'Compila i dati per creare un nuovo dipartimento'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.departments.name} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome del dipartimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.departments.code}</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice (es. DIPS)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.departments.description}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrizione del dipartimento" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvataggio...' : 'Salva'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il dipartimento &quot;{selectedDepartment?.name}&quot;? 
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
