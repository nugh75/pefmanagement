'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Calendar, Pencil, Trash2 } from 'lucide-react'
import { AcademicYearEdition } from '@prisma/client'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

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
import { createAcademicYear, updateAcademicYear, deleteAcademicYear, createBulkAcademicYears, AcademicYearInput } from '@/lib/actions/academic-years'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  yearLabel: z.string().min(1, 'Anno Accademico richiesto'),
  editionLabel: z.string().min(1, 'Edizione richiesta'),
  startDate: z.string().min(1, 'Data inizio richiesta'), // Input date returns string
  endDate: z.string().min(1, 'Data fine richiesta'),
  description: z.string().optional(),
})

interface AcademicYearsClientProps {
  academicYears: AcademicYearEdition[]
  error: string | null
}

export function AcademicYearsClient({ academicYears, error }: AcademicYearsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AcademicYearEdition | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      yearLabel: '',
      editionLabel: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  })

  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: it })
  }

  // Format date for input value (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return format(new Date(date), 'yyyy-MM-dd')
  }

  const columns: ColumnDef<AcademicYearEdition>[] = [
    {
      accessorKey: 'yearLabel',
      header: ({ column }) => <SortableHeader column={column} title={labels.academicYearEditions.yearLabel} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.getValue('yearLabel')}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'editionLabel',
      header: labels.academicYearEditions.editionLabel,
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-slate-50">
          {row.getValue('editionLabel')}
        </Badge>
      ),
    },
    {
      accessorKey: 'startDate',
      header: labels.academicYearEditions.startDate,
      cell: ({ row }) => formatDate(row.getValue('startDate')),
    },
    {
      accessorKey: 'endDate',
      header: labels.academicYearEditions.endDate,
      cell: ({ row }) => formatDate(row.getValue('endDate')),
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
      yearLabel: '', 
      editionLabel: '', 
      startDate: '', 
      endDate: '', 
      description: '' 
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: AcademicYearEdition) => {
    setSelectedItem(item)
    form.reset({
      yearLabel: item.yearLabel,
      editionLabel: item.editionLabel,
      startDate: formatDateForInput(item.startDate),
      endDate: formatDateForInput(item.endDate),
      description: item.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: AcademicYearEdition) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteAcademicYear(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Anno accademico eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    // Convert string dates to Date objects handled by server action validation (which accepts string or date)
    const formData = {
      ...values,
      startDate: values.startDate, // passed as string, validated/shutdown on server
      endDate: values.endDate,
    }

    const result = selectedItem
      ? await updateAcademicYear(selectedItem.id, formData as AcademicYearInput)
      : await createAcademicYear(formData as AcademicYearInput)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Anno accademico aggiornato' : 'Anno accademico creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'anni-accademici',
      columns: [
        { header: 'Anno', accessor: 'yearLabel' },
        { header: 'Edizione', accessor: 'editionLabel' },
        { header: 'Data Inizio', accessor: 'startDate' },
        { header: 'Data Fine', accessor: 'endDate' },
        { header: 'Descrizione', accessor: 'description' },
      ],
      data: academicYears.map(ay => ({
        ...ay,
        startDate: formatDateForInput(ay.startDate),
        endDate: formatDateForInput(ay.endDate)
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-anni-accademici', ['yearLabel', 'editionLabel', 'startDate', 'endDate', 'description'])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkAcademicYears(data)
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
        data={academicYears}
        title={labels.academicYearEditions._title}
        description="Gestione degli anni accademici e delle edizioni"
        searchPlaceholder="Cerca anno o edizione..."
        searchColumn="yearLabel"
        onAdd={handleAdd}
        addLabel="Nuovo Anno Accademico"
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
        fields={['yearLabel', 'editionLabel', 'startDate', 'endDate']}
        title="Importa Anni Accademici"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Anno Accademico' : 'Nuovo Anno Accademico'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati dell\'anno accademico'
                : 'Compila i dati per creare un nuovo anno accademico'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearLabel"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>{labels.academicYearEditions.yearLabel} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. 2024/2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="editionLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.academicYearEditions.editionLabel} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. I, II, III" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.academicYearEditions.startDate} *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.academicYearEditions.endDate} *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                    <FormLabel>{labels.academicYearEditions.description}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Note o descrizione aggiuntiva" 
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
              Sei sicuro di voler eliminare l&apos;anno &quot;{selectedItem?.yearLabel} - {selectedItem?.editionLabel}&quot;? 
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
