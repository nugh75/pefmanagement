'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, Pencil, Trash2, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { StudentProfile, User as UserType } from '@prisma/client'

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
import { createStudentProfile, updateStudentProfile, deleteStudentProfile, createBulkStudentProfiles, StudentProfileInput } from '@/lib/actions/students'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

type StudentWithUser = StudentProfile & { user: UserType }

const formSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  fiscalCode: z.string().length(16, 'Codice Fiscale deve essere di 16 caratteri'),
  email: z.string().email('Email non valida'),
  dateOfBirth: z.string().optional().or(z.literal('')), // Form uses string input type="date"
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
})

interface StudentsClientProps {
  students: StudentWithUser[]
  error: string | null
}

export function StudentsClient({ students, error }: StudentsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StudentWithUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      fiscalCode: '',
      email: '',
      dateOfBirth: '',
      phone: '',
      address: '',
      city: '',
    },
  })

  // Format date helper
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('it-IT')
  }

  // Format date for input helper (YYYY-MM-DD)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  const columns: ColumnDef<StudentWithUser>[] = [
    {
      accessorKey: 'lastName', // Sort by lastName default
      id: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Corsista" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.original.lastName} {row.original.firstName}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              {row.original.fiscalCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user.email',
      header: 'Contatti',
      cell: ({ row }) => (
        <div className="space-y-1 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3" />
            <span>{row.original.user.email}</span>
          </div>
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
      accessorKey: 'dateOfBirth',
      header: 'Data di Nascita',
      cell: ({ row }) => {
        const date = row.getValue('dateOfBirth') as Date | null
        if (!date) return <span className="text-slate-400">-</span>
        return (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(date)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'city',
      header: 'Luogo',
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {row.original.city && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>{row.original.city}</span>
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
      firstName: '',
      lastName: '',
      fiscalCode: '',
      email: '',
      dateOfBirth: '',
      phone: '',
      address: '',
      city: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: StudentWithUser) => {
    setSelectedItem(item)
    form.reset({
      firstName: item.firstName,
      lastName: item.lastName,
      fiscalCode: item.fiscalCode,
      email: item.user.email,
      dateOfBirth: item.dateOfBirth ? formatDateForInput(item.dateOfBirth) : '',
      phone: item.phone || '',
      address: item.address || '',
      city: item.city || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: StudentWithUser) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteStudentProfile(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profilo corsista eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    // Transform date string to Date object or null
    // Also ensuring input type matches StudentProfileInput expected by server action
    // Server action schema: dateOfBirth: z.coerce.date().optional().nullable()
    
    const inputData: StudentProfileInput = {
      ...values,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth : null,
    }

    const result = selectedItem
      ? await updateStudentProfile(selectedItem.id, inputData)
      : await createStudentProfile(inputData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Profilo aggiornato' : 'Profilo creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'corsisti',
      columns: [
        { header: 'Nome', accessor: 'firstName' },
        { header: 'Cognome', accessor: 'lastName' },
        { header: 'Codice Fiscale', accessor: 'fiscalCode' },
        { header: 'Email', accessor: 'email' },
        { header: 'Data di Nascita', accessor: 'dateOfBirth' },
        { header: 'Città', accessor: 'city' },
        { header: 'Telefono', accessor: 'phone' },
      ],
      data: students.map(s => ({
        ...s,
        email: s.user.email,
        dateOfBirth: s.dateOfBirth ? formatDateForInput(s.dateOfBirth) : ''
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-corsisti', [
      'firstName', 
      'lastName', 
      'fiscalCode', 
      'email', 
      'dateOfBirth', // YYYY-MM-DD
      'city', 
      'address', 
      'phone'
    ])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkStudentProfiles(data)
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
        data={students}
        title={labels.studentProfiles._title}
        description="Gestione anagrafica dei corsisti"
        searchPlaceholder="Cerca corsista..."
        searchColumn="name" // filtering by name logic might need tweaking in DataTable if accessors are weird
        // Actually DataTable filters by columnId or accessorKey.
        // We set id='name' for the combined column, but it has accessorKey 'lastName'.
        // Filtering 'lastName' works. If we want cross-column search, we need custom logic.
        // For now let's use 'lastName' as the search key or similar.
        // DataTable helper uses: table.getColumn(searchColumn)?.setFilterValue
        // So we should search by 'lastName' accessorKey? Or 'name' id?
        // Let's rely on 'lastName' for now or 'fiscalCode'. 
        // Or simply text search.
        // Let's use 'lastName' for standard filtering.
        onAdd={handleAdd}
        addLabel="Nuovo Corsista"
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
        fields={['firstName', 'lastName', 'email', 'fiscalCode']}
        title="Importa Corsisti"
        description="Carica un file CSV con le colonne: firstName, lastName, fiscalCode, email, dateOfBirth (YYYY-MM-DD), address, city, phone"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Corsista' : 'Nuovo Corsista'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati anagrafici del corsista'
                : 'Inserisci un nuovo corsista a sistema'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.studentProfiles.firstName} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Mario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.studentProfiles.lastName} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Rossi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fiscalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.studentProfiles.fiscalCode} *</FormLabel>
                      <FormControl>
                        <Input placeholder="RSSMRA..." maxLength={16} className="uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="mario.rossi@email.it" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.studentProfiles.dateOfBirth}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>{labels.studentProfiles.phone}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="333 1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.studentProfiles.city}</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Roma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.studentProfiles.address}</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Via Verdi 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
              Sei sicuro di voler eliminare il profilo di {selectedItem?.firstName} {selectedItem?.lastName}?
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
