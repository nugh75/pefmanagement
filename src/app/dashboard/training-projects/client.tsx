'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, User } from 'lucide-react'
import { TrainingProject, StudentProfile, CourseType, AcademicYearEdition, Department, User as UserType } from '@prisma/client'

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
import { labels } from '@/lib/labels'
import { createTrainingProject, updateTrainingProject, deleteTrainingProject, createBulkTrainingProjects, TrainingProjectInput } from '@/lib/actions/training-projects'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

// Types
type StudentWithUser = StudentProfile & { user: UserType }
type ProjectWithRelations = TrainingProject & {
  student: StudentWithUser
  courseType: CourseType
  academicYearEdition: AcademicYearEdition
  department: Department
}

const formSchema = z.object({
  studentId: z.string().min(1, "Corsista richiesto"),
  courseTypeId: z.string().min(1, "Tipo Percorso richiesto"),
  academicYearEditionId: z.string().min(1, "Anno Accademico richiesto"),
  departmentId: z.string().min(1, "Dipartimento richiesto"),
  status: z.enum(['In_Corso', 'Completato', 'Sospeso', 'Annullato']).default('In_Corso'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

interface TrainingProjectsClientProps {
  projects: ProjectWithRelations[]
  students: StudentWithUser[]
  courseTypes: CourseType[]
  academicYears: AcademicYearEdition[]
  departments: Department[]
  error: string | null
}

export function TrainingProjectsClient({ 
  projects, 
  students, 
  courseTypes, 
  academicYears, 
  departments,
  error 
}: TrainingProjectsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProjectWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      studentId: '',
      courseTypeId: '',
      academicYearEditionId: '',
      departmentId: '',
      status: 'In_Corso',
      startDate: '',
      endDate: '',
    },
  })


  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  // Get status label from labels.ts
  const getStatusLabel = (status: string) => {
    return labels.projectStatus[status as keyof typeof labels.projectStatus] || status
  }

  const columns: ColumnDef<ProjectWithRelations>[] = [
    {
      accessorKey: 'student.lastName', // Sort by lastName
      header: ({ column }) => <SortableHeader column={column} title="Corsista" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.original.student.lastName} {row.original.student.firstName}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              {row.original.student.fiscalCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'courseType.name',
      header: "Percorso",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-slate-700 max-w-[150px] truncate" title={row.original.courseType.name}>
          {row.original.courseType.name}
        </div>
      )
    },
     {
      accessorKey: 'department.name',
      header: "Dipart.",
      cell: ({ row }) => (
        <div className="text-sm text-slate-600 max-w-[100px] truncate" title={row.original.department.name}>
          {row.original.department.name}
        </div>
      )
    },
     {
      accessorKey: 'academicYearEdition.yearLabel',
      header: "A.A.",
      cell: ({ row }) => (
        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600 whitespace-nowrap">
           {row.original.academicYearEdition.yearLabel}
        </span>
      )
    },
    {
        accessorKey: 'status',
        header: 'Stato',
        cell: ({ row }) => {
            const status = row.original.status
            let colorClass = 'bg-slate-100 text-slate-700'
            if (status === 'In_Corso') colorClass = 'bg-blue-100 text-blue-700'
            else if (status === 'Completato') colorClass = 'bg-green-100 text-green-700'
            else if (status === 'Sospeso') colorClass = 'bg-yellow-100 text-yellow-700'
            else if (status === 'Annullato') colorClass = 'bg-red-100 text-red-700'

            return (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
                    {getStatusLabel(status)}
                </span>
            )
        }
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
      studentId: '',
      courseTypeId: '',
      academicYearEditionId: '',
      departmentId: '',
      status: 'In_Corso',
      startDate: '',
      endDate: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: ProjectWithRelations) => {
    setSelectedItem(item)
    form.reset({
      studentId: item.studentId,
      courseTypeId: item.courseTypeId,
      academicYearEditionId: item.academicYearEditionId,
      departmentId: item.departmentId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: item.status as any,
      startDate: formatDateForInput(item.startDate),
      endDate: formatDateForInput(item.endDate),
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: ProjectWithRelations) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteTrainingProject(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Progetto formativo eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    const inputData: TrainingProjectInput = {
      ...values,
      startDate: values.startDate ? new Date(values.startDate) : null,
      endDate: values.endDate ? new Date(values.endDate) : null,
    }

    const result = selectedItem
      ? await updateTrainingProject(selectedItem.id, inputData)
      : await createTrainingProject(inputData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Progetto aggiornato' : 'Progetto creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'progetti-formativi',
      columns: [
        { header: 'Codice Fiscale', accessor: 'studentFiscalCode' },
        { header: 'Cognome', accessor: 'studentLastName' },
        { header: 'Nome', accessor: 'studentFirstName' },
        { header: 'Percorso', accessor: 'courseTypeName' },
        { header: 'Anno', accessor: 'yearLabel' },
        { header: 'Dipartimento', accessor: 'deptName' },
        { header: 'Stato', accessor: 'status' },
      ],
      data: projects.map(p => ({
        ...p,
        studentFiscalCode: p.student.fiscalCode,
        studentLastName: p.student.lastName,
        studentFirstName: p.student.firstName,
        courseTypeName: p.courseType.name,
        yearLabel: p.academicYearEdition.yearLabel,
        deptName: p.department.name,
      })) // status key matches
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-progetti-formativi', [
      'studentFiscalCode', 
      'courseTypeName', // Name matching
      'academicYearLabel', // e.g. 2023/2024
      'departmentCode', // code matching
      'status', // In_Corso, etc.
      'startDate', // YYYY-MM-DD
      'endDate' // YYYY-MM-DD
    ])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkTrainingProjects(data)
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
        data={projects}
        title={labels.trainingProjects._title}
        description="Gestione dei progetti formativi individuali"
        searchPlaceholder="Cerca per cognome corsista..."
        searchColumn="student.lastName"
        onAdd={handleAdd}
        addLabel="Nuovo Progetto"
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
        fields={['studentFiscalCode', 'courseTypeName', 'academicYearLabel', 'departmentCode']}
        title="Importa Progetti Formativi"
        description="Carica un file CSV con le colonne: studentFiscalCode, courseTypeName, academicYearLabel, departmentCode, status, startDate, endDate"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Progetto Formativo' : 'Nuovo Progetto Formativo'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dettagli del progetto formativo'
                : 'Crea un nuovo progetto formativo per un corsista'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.trainingProjects.studentId} *</FormLabel>
                        {/* Consider using a combobox for students if list is huge */}
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!selectedItem}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona corsista..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {students.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.lastName} {s.firstName} ({s.fiscalCode})
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
                    name="courseTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.trainingProjects.courseTypeId} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona percorso..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {courseTypes.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <FormLabel>{labels.trainingProjects.departmentId} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona dipartimento..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {departments.map(d => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
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
                    name="academicYearEditionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.trainingProjects.academicYearEditionId} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona anno..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {academicYears.map(y => (
                              <SelectItem key={y.id} value={y.id}>
                                {y.yearLabel} - {y.editionLabel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.trainingProjects.status} *</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Stato..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(labels.projectStatus).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.trainingProjects.startDate}</FormLabel>
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
                        <FormLabel>{labels.trainingProjects.endDate}</FormLabel>
                        <FormControl>
                           <Input type="date" {...field} />
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
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il progetto formativo di {selectedItem?.student.lastName}?
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
