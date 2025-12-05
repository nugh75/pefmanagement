'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import { School } from '@prisma/client'

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
import { labels } from '@/lib/labels'
import { createSchool, updateSchool, deleteSchool, createBulkSchools, SchoolFormData } from '@/lib/actions/schools'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Nome scuola richiesto'),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
})

interface SchoolsClientProps {
  schools: School[]
  error: string | null
}

export function SchoolsClient({ schools, error }: SchoolsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      province: '',
      contactPerson: '',
      phone: '',
      email: '',
    },
  })

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} title={labels.schools.name} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.getValue('name')}</p>
            {row.original.city && (
              <p className="text-xs text-slate-500">
                {row.original.city} {row.original.province ? `(${row.original.province})` : ''}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contacts',
      header: 'Contatti',
      cell: ({ row }) => (
        <div className="space-y-1 text-sm text-slate-600">
          {row.original.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span>{row.original.email}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Indirizzo',
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {row.original.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{row.original.address}</span>
            </div>
          )}
        </div>
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
      address: '', 
      city: '', 
      province: '', 
      contactPerson: '', 
      phone: '', 
      email: '' 
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: School) => {
    setSelectedItem(item)
    form.reset({
      name: item.name,
      address: item.address || '',
      city: item.city || '',
      province: item.province || '',
      contactPerson: item.contactPerson || '',
      phone: item.phone || '',
      email: item.email || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: School) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteSchool(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Istituto eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    const result = selectedItem
      ? await updateSchool(selectedItem.id, values as SchoolFormData)
      : await createSchool(values as SchoolFormData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Istituto aggiornato' : 'Istituto creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'scuole',
      columns: [
        { header: 'Nome', accessor: 'name' },
        { header: 'Indirizzo', accessor: 'address' },
        { header: 'Città', accessor: 'city' },
        { header: 'Provincia', accessor: 'province' },
        { header: 'Referente', accessor: 'contactPerson' },
        { header: 'Telefono', accessor: 'phone' },
        { header: 'Email', accessor: 'email' },
      ],
      data: schools as unknown as Record<string, unknown>[]
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-scuole', ['name', 'address', 'city', 'province', 'contactPerson', 'phone', 'email'])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkSchools(data)
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
        data={schools}
        title={labels.schools._title}
        description="Gestione degli istituti scolastici accreditati"
        searchPlaceholder="Cerca scuola..."
        searchColumn="name"
        onAdd={handleAdd}
        addLabel="Nuovo Istituto"
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
        title="Importa Scuole"
        description="Carica un file CSV con le colonne: name, address, city, province, email, phone, contactPerson"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Istituto' : 'Nuovo Istituto'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati dell\'istituto scolastico'
                : 'Inserisci un nuovo istituto scolastico a sistema'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.schools.name} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. I.I.S. Volta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.schools.city}</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Milano" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.schools.province}</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. MI" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.schools.address}</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Via Roma 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.schools.email}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="segreteria@scuola.it" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.schools.phone}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="02 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.schools.contactPerson}</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome del referente" {...field} />
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
