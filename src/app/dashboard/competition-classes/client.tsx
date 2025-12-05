'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GraduationCap, Pencil, Trash2 } from 'lucide-react'
import { CompetitionClass } from '@prisma/client'

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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { labels } from '@/lib/labels'
import { createCompetitionClass, updateCompetitionClass, deleteCompetitionClass, createBulkCompetitionClasses, CompetitionClassFormData } from '@/lib/actions/competition-classes'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  code: z.string().min(1, 'Codice richiesto (es. A-01)'),
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().optional(),
})

interface CompetitionClassesClientProps {
  competitionClasses: CompetitionClass[]
  error: string | null
}

export function CompetitionClassesClient({ competitionClasses, error }: CompetitionClassesClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CompetitionClass | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
    },
  })

  const columns: ColumnDef<CompetitionClass>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <SortableHeader column={column} title={labels.competitionClasses.code} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.getValue('code')}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: labels.competitionClasses.name,
      cell: ({ row }) => (
        <p className="text-slate-900 font-medium">
          {row.getValue('name')}
        </p>
      ),
    },
    {
      accessorKey: 'description',
      header: labels.competitionClasses.description,
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
    setSelectedItem(null)
    form.reset({ 
      code: '', 
      name: '', 
      description: '' 
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: CompetitionClass) => {
    setSelectedItem(item)
    form.reset({
      code: item.code,
      name: item.name,
      description: item.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: CompetitionClass) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteCompetitionClass(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Classe di concorso eliminata')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    const result = selectedItem
      ? await updateCompetitionClass(selectedItem.id, values as CompetitionClassFormData)
      : await createCompetitionClass(values as CompetitionClassFormData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Classe di concorso aggiornata' : 'Classe di concorso creata')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'classi-concorso',
      columns: [
        { header: 'Codice', accessor: 'code' },
        { header: 'Nome', accessor: 'name' },
        { header: 'Descrizione', accessor: 'description' },
      ],
      data: competitionClasses as unknown as Record<string, unknown>[]
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-classi-concorso', ['code', 'name', 'description'])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkCompetitionClasses(data)
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
        data={competitionClasses}
        title={labels.competitionClasses._title}
        description="Gestione delle classi di concorso per i docenti"
        searchPlaceholder="Cerca classe o codice..."
        searchColumn="name"
        onAdd={handleAdd}
        addLabel="Nuova Classe"
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
        fields={['code', 'name']}
        title="Importa Classi di Concorso"
        description="Carica un file CSV con le colonne: code, name, description"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Classe' : 'Nuova Classe'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati della classe di concorso'
                : 'Definisci una nuova classe di concorso'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.competitionClasses.code} *</FormLabel>
                        <FormControl>
                          <Input placeholder="Es. A-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.competitionClasses.name} *</FormLabel>
                        <FormControl>
                          <Input placeholder="Es. Arte e Immagine" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.competitionClasses.description}</FormLabel>
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
              Sei sicuro di voler eliminare &quot;{selectedItem?.code} - {selectedItem?.name}&quot;? 
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
