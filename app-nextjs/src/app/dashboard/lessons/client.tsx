'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Calendar, Pencil, Trash2, Clock, MapPin, Video } from 'lucide-react'
import { Lesson, Course, TeacherProfile, User } from '@prisma/client'

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
import { createLesson, updateLesson, deleteLesson, createBulkLessons, LessonInput } from '@/lib/actions/lessons'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

type TeacherWithUser = TeacherProfile & { user: User }
type LessonWithRelations = Lesson & { course: Course; teacher: TeacherWithUser }

const formSchema = z.object({
  courseId: z.string().min(1, "Insegnamento richiesto"),
  teacherId: z.string().min(1, "Docente richiesto"),
  lessonDate: z.string().min(1, "Data richiesta"),
  startTime: z.string().min(1, "Ora inizio richiesta"),
  endTime: z.string().min(1, "Ora fine richiesta"),
  room: z.string().optional(),
  teamsMeetingLink: z.string().optional(),
  lessonCfu: z.coerce.number().min(0).default(0),
})

interface LessonsClientProps {
  lessons: LessonWithRelations[]
  courses: Course[]
  teachers: TeacherWithUser[]
  error: string | null
}

export function LessonsClient({ lessons, courses, teachers, error }: LessonsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LessonWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      courseId: '',
      teacherId: '',
      lessonDate: '',
      startTime: '',
      endTime: '',
      room: '',
      teamsMeetingLink: '',
      lessonCfu: 0,
    },
  })

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT')
  }

  // Format time helper (HH:mm)
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  // Format date for input helper (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0]
  }


  const columns: ColumnDef<LessonWithRelations>[] = [
    {
      accessorKey: 'lessonDate',
      header: ({ column }) => <SortableHeader column={column} title="Data" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <Calendar className="w-4 h-4 text-slate-500" />
          {formatDate(row.original.lessonDate)}
        </div>
      ),
    },
    {
      accessorKey: 'startTime', // Sort by start time if needed
      header: 'Orario',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>{formatTime(row.original.startTime)} - {formatTime(row.original.endTime)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'course.name',
      header: 'Insegnamento',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.course.name}</span>
      ),
    },
    {
      accessorKey: 'teacher.lastName',
      header: 'Docente',
      cell: ({ row }) => (
        <div className="text-sm">
           {row.original.teacher.lastName} {row.original.teacher.firstName}
        </div>
      ),
    },
    {
        accessorKey: 'room',
        header: 'Aula/Link',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 text-xs">
            {row.original.room && (
                <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {row.original.room}
                </div>
            )}
             {row.original.teamsMeetingLink && (
                <div className="flex items-center gap-1 text-blue-600">
                    <Video className="w-3 h-3" /> <a href={row.original.teamsMeetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">Link</a>
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
      courseId: '',
      teacherId: '',
      lessonDate: '',
      startTime: '',
      endTime: '',
      room: '',
      teamsMeetingLink: '',
      lessonCfu: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: LessonWithRelations) => {
    setSelectedItem(item)
    // Need to extract HH:mm from ISO string properly for local time
    // This is tricky with timezones. Assuming server returns UTC.
    // Let's use string manipulation if possible or Date methods.
    
    // Quick fix: use substring if format is reliable or date methods
    // Ideally we should use a library like date-fns but sticking to native for now
    const startObj = new Date(item.startTime)
    const endObj = new Date(item.endTime)
    
    // To get HH:mm in local time:
    const startStr = startObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    const endStr = endObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

    form.reset({
      courseId: item.courseId,
      teacherId: item.teacherId,
      lessonDate: formatDateForInput(item.lessonDate),
      startTime: startStr,
      endTime: endStr,
      room: item.room || '',
      teamsMeetingLink: item.teamsMeetingLink || '',
      lessonCfu: Number(item.lessonCfu),
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: LessonWithRelations) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteLesson(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Lezione eliminata')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    // Combine date and time
    // values.lessonDate is YYYY-MM-DD
    // values.startTime is HH:mm
    
    const startDateTime = new Date(`${values.lessonDate}T${values.startTime}:00`)
    const endDateTime = new Date(`${values.lessonDate}T${values.endTime}:00`)
    const lessonDate = new Date(values.lessonDate)

    const inputData: LessonInput = {
      courseId: values.courseId,
      teacherId: values.teacherId,
      lessonDate: lessonDate,
      startTime: startDateTime,
      endTime: endDateTime,
      room: values.room || null,
      teamsMeetingLink: values.teamsMeetingLink || null,
      lessonCfu: values.lessonCfu,
    }

    const result = selectedItem
      ? await updateLesson(selectedItem.id, inputData)
      : await createLesson(inputData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Lezione aggiornata' : 'Lezione creata')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'lezioni',
      columns: [
        { header: 'Data', accessor: 'dateStr' },
        { header: 'Inizio', accessor: 'startStr' },
        { header: 'Fine', accessor: 'endStr' },
        { header: 'Insegnamento', accessor: 'courseName' },
        { header: 'Docente', accessor: 'teacherName' },
        { header: 'Aula', accessor: 'room' },
      ],
      data: lessons.map(l => ({
        ...l,
        dateStr: formatDate(l.lessonDate),
        startStr: formatTime(l.startTime),
        endStr: formatTime(l.endTime),
        courseName: l.course.name,
        teacherName: `${l.teacher.lastName} ${l.teacher.firstName}`,
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-lezioni', [
      'courseName', 
      'teacherEmail', 
      'date', // YYYY-MM-DD
      'startTime', // HH:mm
      'endTime', // HH:mm
      'room',
      'lessonCfu'
    ])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    const result = await createBulkLessons(data)
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
        data={lessons}
        title={labels.lessons._title}
        description="Gestione del calendario delle lezioni"
        searchPlaceholder="Cerca lezione..."
        searchColumn="course.name" // Not ideal for deep search implies we need flatten or custom filter
        onAdd={handleAdd}
        addLabel="Nuova Lezione"
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
        fields={['courseName', 'teacherEmail', 'date']}
        title="Importa Lezioni"
        description="Carica un file CSV con le colonne: courseName, teacherEmail, date (YYYY-MM-DD), startTime (HH:mm), endTime (HH:mm), room"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Lezione' : 'Nuova Lezione'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dettagli della lezione'
                : 'Pianifica una nuova lezione'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.lessons.courseId} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name}
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
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.lessons.teacherId} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.lastName} {t.firstName}
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
                    name="lessonDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.lessons.lessonDate} *</FormLabel>
                        <FormControl>
                           <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{labels.lessons.startTime} *</FormLabel>
                          <FormControl>
                             <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{labels.lessons.endTime} *</FormLabel>
                          <FormControl>
                             <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
              </div>

               <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.lessons.room}</FormLabel>
                        <FormControl>
                           <Input placeholder="Es. Aula Magna" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lessonCfu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.lessons.lessonCfu}</FormLabel>
                        <FormControl>
                           <Input type="number" step="0.1" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

               <FormField
                    control={form.control}
                    name="teamsMeetingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{labels.lessons.teamsMeetingLink}</FormLabel>
                        <FormControl>
                           <Input placeholder="https://teams.microsoft.com/..." {...field} />
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
              Sei sicuro di voler eliminare questa lezione?
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
