'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Mail, Building, School as SchoolIcon } from 'lucide-react'
import { CoordinatorTutorProfile, CollaboratorTutorProfile, User, Department, School } from '@prisma/client'

import { DataTable, SortableHeader } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
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
import { 
  createCoordinatorTutor, updateCoordinatorTutor, deleteCoordinatorTutor, createBulkCoordinatorTutors,
  createCollaboratorTutor, updateCollaboratorTutor, deleteCollaboratorTutor, createBulkCollaboratorTutors,
  TutorInput 
} from '@/lib/actions/tutors'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  schoolId: z.string().optional().nullable(),
})

type CoordinatorWithDetails = CoordinatorTutorProfile & { user: User; department: Department | null }
type CollaboratorWithDetails = CollaboratorTutorProfile & { user: User; school: School | null }

interface TutorsClientProps {
  coordinators: CoordinatorWithDetails[]
  collaborators: CollaboratorWithDetails[]
  departments: Department[]
  schools: School[]
  error: string | null
}

export function TutorsClient({ coordinators, collaborators, departments, schools, error }: TutorsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('coordinators')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  
  // We use union type for selected item, but we track type by activeTab
  const [selectedItem, setSelectedItem] = useState<CoordinatorWithDetails | CollaboratorWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: null,
      schoolId: null,
    },
  })

  // Coordinator Columns
  const coordinatorColumns: ColumnDef<CoordinatorWithDetails>[] = [
    {
      accessorKey: 'lastName',
      header: ({ column }) => <SortableHeader column={column} title="Coordinatore" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-sm">
              {row.original.firstName.charAt(0)}{row.original.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.original.lastName} {row.original.firstName}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user.email',
      header: 'Contatti',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{row.original.user.email}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'department.name',
      header: 'Dipartimento',
      cell: ({ row }) => (
        row.original.department ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building className="w-3 h-3" />
            <span>{row.original.department.name}</span>
          </div>
        ) : '-'
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original, 'coordinators')}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(row.original, 'coordinators')} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Collaborator Columns
  const collaboratorColumns: ColumnDef<CollaboratorWithDetails>[] = [
    {
      accessorKey: 'lastName',
      header: ({ column }) => <SortableHeader column={column} title="Collaboratore" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-teal-600 font-semibold text-sm">
              {row.original.firstName.charAt(0)}{row.original.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.original.lastName} {row.original.firstName}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user.email', // This might need explicit accessorFn if not working directly
      header: 'Contatti',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{row.original.user.email}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'school.name',
      header: 'Istituto',
      cell: ({ row }) => (
        row.original.school ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <SchoolIcon className="w-3 h-3" />
            <span>{row.original.school.name}</span>
          </div>
        ) : '-'
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original, 'collaborators')}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(row.original, 'collaborators')} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const handleAdd = () => {
    setSelectedItem(null)
    form.reset({
      firstName: '', lastName: '', email: '', phone: '', departmentId: null, schoolId: null
    })
    setIsDialogOpen(true)
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const handleEdit = (item: CoordinatorWithDetails | CollaboratorWithDetails, _type: string) => {
  /* eslint-enable @typescript-eslint/no-unused-vars */
    setSelectedItem(item)
    // Ensure we are in correct tab (though usually triggered from correct tab)
    const isCoordinator = (i: CoordinatorWithDetails | CollaboratorWithDetails): i is CoordinatorWithDetails => 'departmentId' in i
    const isCollaborator = (i: CoordinatorWithDetails | CollaboratorWithDetails): i is CollaboratorWithDetails => 'schoolId' in i

    form.reset({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.user.email,
      phone: item.phone || '',
      departmentId: isCoordinator(item) ? item.departmentId : null,
      schoolId: isCollaborator(item) ? item.schoolId : null,
    })
    setIsDialogOpen(true)
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const handleDeleteClick = (item: CoordinatorWithDetails | CollaboratorWithDetails, _type: string) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const handleDelete = async () => {
  /* eslint-enable @typescript-eslint/no-unused-vars */
    if (!selectedItem) return
    setIsLoading(true)
    
    let result;
    if (activeTab === 'coordinators') {
      result = await deleteCoordinatorTutor(selectedItem.id)
    } else {
      result = await deleteCollaboratorTutor(selectedItem.id)
    }
    
    setIsLoading(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Tutor eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    const formData: TutorInput = {
      ...values,
      phone: values.phone || undefined,
      departmentId: values.departmentId === "none" ? null : values.departmentId,
      schoolId: values.schoolId === "none" ? null : values.schoolId,
    }

    let result;
    if (activeTab === 'coordinators') {
      result = selectedItem 
        ? await updateCoordinatorTutor(selectedItem.id, formData)
        : await createCoordinatorTutor(formData)
    } else {
      result = selectedItem
        ? await updateCollaboratorTutor(selectedItem.id, formData)
        : await createCollaboratorTutor(formData)
    }

    setIsLoading(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success(selectedItem ? 'Tutor aggiornato' : 'Tutor creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    if (activeTab === 'coordinators') {
      downloadCsv({
        filename: 'tutor-coordinatori',
        columns: [
          { header: 'Nome', accessor: 'firstName' },
          { header: 'Cognome', accessor: 'lastName' },
          { header: 'Email', accessor: 'email' },
          { header: 'Dipartimento', accessor: 'departmentName' },
        ],
        data: coordinators.map(c => ({
          ...c,
          email: c.user.email,
          departmentName: c.department?.name || ''
        }))
      })
    } else {
      downloadCsv({
        filename: 'tutor-collaboratori',
        columns: [
          { header: 'Nome', accessor: 'firstName' },
          { header: 'Cognome', accessor: 'lastName' },
          { header: 'Email', accessor: 'email' },
          { header: 'Istituto', accessor: 'schoolName' },
        ],
        data: collaborators.map(c => ({
          ...c,
          email: c.user.email,
          schoolName: c.school?.name || ''
        }))
      })
    }
  }

  const handleDownloadTemplate = () => {
    if (activeTab === 'coordinators') {
      downloadCsvTemplate('modello-tutor-coordinatori', ['firstName', 'lastName', 'email', 'phone', 'departmentCode'])
    } else {
      downloadCsvTemplate('modello-tutor-collaboratori', ['firstName', 'lastName', 'email', 'phone', 'schoolName'])
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    let result
    if (activeTab === 'coordinators') {
      result = await createBulkCoordinatorTutors(data)
    } else {
      result = await createBulkCollaboratorTutors(data)
    }

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestione Tutor</h2>
          <p className="text-muted-foreground">Gestione tutor coordinatori e collaboratori</p>
        </div>
        <Button onClick={handleAdd}>Nuovo Tutor</Button>
      </div>

      <Tabs defaultValue="coordinators" onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="coordinators">Coordinatori</TabsTrigger>
          <TabsTrigger value="collaborators">Collaboratori</TabsTrigger>
        </TabsList>
        <TabsContent value="coordinators">
          <DataTable 
            columns={coordinatorColumns} 
            data={coordinators} 
            title="Elenco Tutor Coordinatori"
            searchColumn="lastName" 
            searchPlaceholder="Cerca coordinatore..."
            actions={
              <CsvToolbar 
                onExport={handleExport} 
                onDownloadTemplate={handleDownloadTemplate} 
                onImportClick={() => setIsImportOpen(true)} 
              />
            }
          />
        </TabsContent>
        <TabsContent value="collaborators">
          <DataTable 
            columns={collaboratorColumns} 
            data={collaborators} 
            title="Elenco Tutor Collaboratori"
            searchColumn="lastName" 
            searchPlaceholder="Cerca collaboratore..."
            actions={
              <CsvToolbar 
                onExport={handleExport} 
                onDownloadTemplate={handleDownloadTemplate} 
                onImportClick={() => setIsImportOpen(true)} 
              />
            }
          />
        </TabsContent>
      </Tabs>

      <CsvImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        fields={['firstName', 'lastName', 'email']}
        title={`Importa Tutor ${activeTab === 'coordinators' ? 'Coordinatori' : 'Collaboratori'}`}
        description={`Carica un file CSV con le colonne: firstName, lastName, email, phone, ${activeTab === 'coordinators' ? 'departmentCode' : 'schoolName'}`}
      />

      {/* Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Modifica Tutor' : 'Nuovo Tutor'} ({activeTab === 'coordinators' ? 'Coordinatore' : 'Collaboratore'})</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Cognome *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email *</FormLabel><FormControl><Input {...field} disabled={!!selectedItem} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Telefono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              {activeTab === 'coordinators' && (
                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dipartimento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "none"} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessuno</SelectItem>
                        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}

              {activeTab === 'collaborators' && (
                <FormField control={form.control} name="schoolId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Istituto Scolastico</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "none"} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessuno</SelectItem>
                        {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvataggio...' : 'Salva'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogContent>Sei sicuro di voler eliminare questo tutor?</DialogContent>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annulla</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>Elimina</Button>
            </DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
