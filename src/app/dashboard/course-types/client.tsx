'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Pencil, Trash2 } from 'lucide-react'
import { CourseType } from '@prisma/client'

import { DataTable, SortableHeader } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { labels } from '@/lib/labels'
import { createCourseType, updateCourseType, deleteCourseType, createBulkCourseTypes, CourseTypeFormData } from '@/lib/actions/course-types'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
  hasInItinereExams: z.boolean(),
})

interface CourseTypesClientProps {
  courseTypes: CourseType[]
  error: string | null
}

export function CourseTypesClient({ courseTypes, error }: CourseTypesClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CourseType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      hasInItinereExams: false,
    },
  })

  const columns: ColumnDef<CourseType>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title={labels.courseTypes.name} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.getValue('name')}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: labels.courseTypes.description,
      cell: ({ row }) => (
        <p className="text-slate-600 truncate max-w-xs">
          {row.getValue('description') || '-'}
        </p>
      ),
    },
    {
      accessorKey: 'hasInItinereExams',
      header: labels.courseTypes.hasInItinereExams,
      cell: ({ row }) => (
        row.getValue('hasInItinereExams') ? (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200"> Sì </Badge>
        ) : (
          <Badge variant="outline" className="text-slate-500"> No </Badge>
        )
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
    setSelectedItem(null)
    form.reset({ 
      name: '', 
      description: '', 
      hasInItinereExams: false 
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: CourseType) => {
    setSelectedItem(item)
    form.reset({
      name: item.name,
      description: item.description || '',
      hasInItinereExams: item.hasInItinereExams,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: CourseType) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteCourseType(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Tipologia eliminata')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    const result = selectedItem
      ? await updateCourseType(selectedItem.id, values as CourseTypeFormData)
      : await createCourseType(values as CourseTypeFormData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Tipologia aggiornata' : 'Tipologia creata')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'tipologie-percorso',
      columns: [
        { header: 'Nome', accessor: 'name' },
        { header: 'Descrizione', accessor: 'description' },
        { header: 'Esami in Itinere', accessor: 'hasInItinereExams' },
      ],
      data: courseTypes.map(c => ({
        ...c,
        hasInItinereExams: c.hasInItinereExams ? 'Si' : 'No'
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-tipologie-percorso', ['name', 'description', 'hasInItinereExams'])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkCourseTypes(data)
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
        data={courseTypes}
        title={labels.courseTypes._title}
        description="Gestione delle tipologie di percorso (es. 30 CFU, 60 CFU)"
        searchPlaceholder="Cerca tipologia..."
        searchColumn="name"
        onAdd={handleAdd}
        addLabel="Nuova Tipologia"
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
        fields={['name']}
        title="Importa Tipologie Percorso"
        description="Carica un file CSV con le colonne: name, description, hasInItinereExams (true/false)"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Tipologia' : 'Nuova Tipologia'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati della tipologia di percorso'
                : 'Definisci una nuova tipologia di percorso'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.courseTypes.name} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Percorso 60 CFU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasInItinereExams"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {labels.courseTypes.hasInItinereExams}
                      </FormLabel>
                      <FormDescription>
                        Indica se questo percorso prevede esami intermedi
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.courseTypes.description}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrizione dettagliata" 
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
              Sei sicuro di voler eliminare &quot;{selectedItem?.name}&quot;? 
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
