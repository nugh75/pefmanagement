'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Pencil, Trash2, Building2 } from 'lucide-react'
import { Course, Department } from '@prisma/client'

import { DataTable, SortableHeader } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { labels } from '@/lib/labels'
import { createCourse, updateCourse, deleteCourse, createBulkCourses, CourseInput } from '@/lib/actions/courses'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

type CourseWithDepartment = Course & { department: Department | null }

const formSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  cfu: z.coerce.number().min(1, 'I CFU devono essere almeno 1'),
  description: z.string().optional(),
  departmentId: z.string().optional().nullable(),
})

interface CoursesClientProps {
  courses: CourseWithDepartment[]
  departments: Department[]
  error: string | null
}

export function CoursesClient({ courses, departments, error }: CoursesClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CourseWithDepartment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      cfu: 6,
      description: '',
      departmentId: 'none', // Use string 'none' for select placeholder handling if needed or ''
    },
  })

  const columns: ColumnDef<CourseWithDepartment>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Insegnamento" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.original.name}
            </p>
            {row.original.description && (
              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                {row.original.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cfu',
      header: ({ column }) => <SortableHeader column={column} title="CFU" />,
      cell: ({ row }) => (
        <div className="font-mono font-medium text-slate-700">
          {row.original.cfu}
        </div>
      ),
    },
    {
      accessorKey: 'department.name',
      header: 'Dipartimento',
      cell: ({ row }) => {
        const dept = row.original.department
        if (!dept) return <span className="text-slate-400 text-sm">-</span>
        return (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-3 h-3" />
            <span>{dept.name}</span>
          </div>
        )
      },
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
    setSelectedItem(null)
    form.reset({
      name: '',
      cfu: 6,
      description: '',
      departmentId: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: CourseWithDepartment) => {
    setSelectedItem(item)
    form.reset({
      name: item.name,
      cfu: item.cfu,
      description: item.description || '',
      departmentId: item.departmentId || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: CourseWithDepartment) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteCourse(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Insegnamento eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    // Convert 'none' or empty string back to null if needed
    const inputData: CourseInput = {
      ...values,
      departmentId: values.departmentId === '' || values.departmentId === 'none' ? null : values.departmentId
    }

    const result = selectedItem
      ? await updateCourse(selectedItem.id, inputData)
      : await createCourse(inputData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Insegnamento aggiornato' : 'Insegnamento creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'insegnamenti',
      columns: [
        { header: 'Nome', accessor: 'name' },
        { header: 'CFU', accessor: 'cfu' },
        { header: 'Dipartimento', accessor: 'departmentName' }, // flatten helper
        { header: 'Descrizione', accessor: 'description' },
      ],
      data: courses.map(c => ({
        ...c,
        departmentName: c.department?.name || ''
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-insegnamenti', [
      'name', 
      'cfu', 
      'description', 
      'departmentCode', // Suggest code for cleaner import, or name
    ])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkCourses(data)
    if (result.error) {
      return { success: false, error: result.error }
    }
    return { success: true, count: result.count }
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
        data={courses}
        title={labels.courses._title}
        description="Gestione degli insegnamenti e dei corsi"
        searchPlaceholder="Cerca insegnamento..."
        searchColumn="name"
        onAdd={handleAdd}
        addLabel="Nuovo Insegnamento"
        actions={
          <CsvToolbar 
            onExport={handleExport} 
            onDownloadTemplate={handleDownloadTemplate} 
            onImportClick={() => setIsImportOpen(true)} 
          />
        }
      />

      <CsvImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        fields={['name', 'cfu']}
        title="Importa Insegnamenti"
        description="Carica un file CSV con le colonne: name, cfu, description, departmentCode (opzionale)"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Insegnamento' : 'Nuovo Insegnamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dettagli dell&apos;insegnamento'
                : 'Crea un nuovo insegnamento'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.courses.name} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Pedagogia Generale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cfu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.courses.cfu} *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.courses.departmentId}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" className="text-slate-500">Nessun dipartimento</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.courses.description}</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrizione del corso..." {...field} />
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
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare l&apos;insegnamento &quot;{selectedItem?.name}&quot;?
              Questa azione è irreversibile.
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
