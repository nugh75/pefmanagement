'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, Pencil, Trash2, Mail, Phone, Building2, GraduationCap } from 'lucide-react'
import { TeacherProfile, User as UserType, Department, CompetitionClass } from '@prisma/client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { labels } from '@/lib/labels'
import { createTeacherProfile, updateTeacherProfile, deleteTeacherProfile, createBulkTeacherProfiles, TeacherProfileInput } from '@/lib/actions/teachers'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

type TeacherWithRelations = TeacherProfile & { 
  user: UserType,
  department: Department | null,
  competitionClass: CompetitionClass | null
}

const formSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  departmentId: z.string().optional().or(z.literal('none')), // Handle optional select
  competitionClassId: z.string().optional().or(z.literal('none')),
})

interface TeachersClientProps {
  teachers: TeacherWithRelations[]
  departments: Department[]
  competitionClasses: CompetitionClass[]
  error: string | null
}

export function TeachersClient({ teachers, departments, competitionClasses, error }: TeachersClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TeacherWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      competitionClassId: '',
    },
  })

  // Format date helper
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('it-IT')
  }

  const columns: ColumnDef<TeacherWithRelations>[] = [
    {
      accessorKey: 'lastName',
      id: 'name',
      header: ({ column }) => <SortableHeader column={column} title="Docente" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.original.lastName} {row.original.firstName}
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
      accessorKey: 'department.name',
      header: 'Dipartimento',
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {row.original.department && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[150px]" title={row.original.department.name}>
                {row.original.department.name}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'competitionClass.code',
      header: 'CdC',
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {row.original.competitionClass && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3 h-3" />
              <span>{row.original.competitionClass.code}</span>
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
      email: '',
      phone: '',
      departmentId: 'none',
      competitionClassId: 'none',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: TeacherWithRelations) => {
    setSelectedItem(item)
    form.reset({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.user.email,
      phone: item.phone || '',
      departmentId: item.departmentId || 'none',
      competitionClassId: item.competitionClassId || 'none',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: TeacherWithRelations) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteTeacherProfile(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profilo docente eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    const inputData: TeacherProfileInput = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || null,
      departmentId: values.departmentId === 'none' ? null : values.departmentId,
      competitionClassId: values.competitionClassId === 'none' ? null : values.competitionClassId,
    }

    const result = selectedItem
      ? await updateTeacherProfile(selectedItem.id, inputData)
      : await createTeacherProfile(inputData)

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
      filename: 'docenti',
      columns: [
        { header: 'Nome', accessor: 'firstName' },
        { header: 'Cognome', accessor: 'lastName' },
        { header: 'Email', accessor: 'email' },
        { header: 'Telefono', accessor: 'phone' },
        { header: 'Dipartimento', accessor: 'departmentCode' },
        { header: 'Classe Concorso', accessor: 'competitionClassCode' },
      ],
      data: teachers.map(t => ({
        ...t,
        email: t.user.email,
        departmentCode: t.department?.code || '',
        competitionClassCode: t.competitionClass?.code || '',
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-docenti', [
      'firstName', 
      'lastName', 
      'email', 
      'phone', 
      'departmentCode', // Lookup key
      'competitionClassCode' // Lookup key
    ])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    // Client side calls the updated bulk action
    const result = await createBulkTeacherProfiles(data)
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
        data={teachers}
        title={labels.teacherProfiles._title}
        description="Gestione anagrafica dei docenti"
        searchPlaceholder="Cerca docente..."
        searchColumn="name"
        onAdd={handleAdd}
        addLabel="Nuovo Docente"
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
        fields={['firstName', 'lastName', 'email']}
        title="Importa Docenti"
        description="Carica un file CSV con le colonne: firstName, lastName, email, phone, departmentCode, competitionClassCode"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Docente' : 'Nuovo Docente'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati anagrafici del docente'
                : 'Inserisci un nuovo docente a sistema'}
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
                      <FormLabel>{labels.teacherProfiles.firstName} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Giuseppe" {...field} />
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
                      <FormLabel>{labels.teacherProfiles.lastName} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Verdi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="giuseppe.verdi@email.it" {...field} />
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
                      <FormLabel>{labels.teacherProfiles.phone}</FormLabel>
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
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dipartimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona dipartimento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nessun dipartimento</SelectItem>
                          {departments.map((dept) => (
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
                <FormField
                  control={form.control}
                  name="competitionClassId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe di Concorso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona classe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nessuna classe</SelectItem>
                          {competitionClasses.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.code} - {cc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
