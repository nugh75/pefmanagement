'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Building, User as UserIcon } from 'lucide-react'
import { User, Department } from '@prisma/client'
import { USER_ROLES } from '@/types/roles'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { labels } from '@/lib/labels'
import { createUser, updateUser, deleteUser, createBulkUsers, UserFormData } from '@/lib/actions/users'
import { CsvToolbar } from '@/components/csv/csv-toolbar'
import { CsvImportDialog } from '@/components/csv/csv-import-dialog'
import { downloadCsv, downloadCsvTemplate } from '@/lib/csv-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const userSchema = z.object({
  email: z.string().email('Email non valida'),
  role: z.string().min(1, 'Ruolo richiesto'),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean(),
})

type UserWithDepartment = User & {
  department?: Department | null
}

interface UsersClientProps {
  users: UserWithDepartment[]
  departments: Department[]
  error: string | null
}

export function UsersClient({ users, departments, error }: UsersClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UserWithDepartment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      role: '',
      departmentId: null,
      isActive: true,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _role = form.watch('role')

  const columns: ColumnDef<UserWithDepartment>[] = [
    {
      accessorKey: 'email',
      header: ({ column }) => <SortableHeader column={column} title="Utente" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.getValue('email')}</p>
            {row.original.isActive ? (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Attivo
              </span>
            ) : (
              <span className="text-xs text-rose-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Disattivato
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Ruolo',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        const label = labels.roles[role as keyof typeof labels.roles] || role
        return (
          <Badge variant="outline" className="font-normal">
            {label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'department.name',
      header: 'Dipartimento',
      cell: ({ row }) => {
        const dept = row.original.department
        return dept ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building className="w-4 h-4" />
            <span className="truncate max-w-[150px]" title={dept.name}>{dept.name}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
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
      email: '', 
      role: 'CORSISTA',
      departmentId: null,
      isActive: true 
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: UserWithDepartment) => {
    setSelectedItem(item)
    form.reset({
      email: item.email,
      role: item.role,
      departmentId: item.departmentId || null,
      isActive: item.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (item: UserWithDepartment) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    setIsLoading(true)
    const result = await deleteUser(selectedItem.id)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Utente eliminato')
      setIsDeleteDialogOpen(false)
      router.refresh()
    }
  }

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    setIsLoading(true)
    
    const formData = {
      ...values,
      departmentId: values.departmentId === "none" ? null : values.departmentId
    }

    const result = selectedItem
      ? await updateUser(selectedItem.id, formData as UserFormData)
      : await createUser(formData as UserFormData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(selectedItem ? 'Utente aggiornato' : 'Utente creato')
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  const handleExport = () => {
    downloadCsv({
      filename: 'utenti',
      columns: [
        { header: 'Email', accessor: 'email' },
        { header: 'Ruolo', accessor: 'role' },
        { header: 'Dipartimento', accessor: 'departmentCode' },
        { header: 'Attivo', accessor: 'isActive' },
      ],
      data: users.map(u => ({
        ...u,
        departmentCode: u.department?.code || '',
        isActive: u.isActive ? 'SI' : 'NO'
      }))
    })
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('modello-utenti', ['email', 'role', 'departmentCode', 'isActive'])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImport = async (data: any[]) => {
    // Convert isActive 'SI'/'NO' or boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preparedData = data.map((d: any) => ({
      ...d,
      isActive: String(d.isActive).toUpperCase() === 'SI' || d.isActive === true || d.isActive === 'true'
    }))
    
    const result = await createBulkUsers(preparedData)
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
        data={users}
        title="Gestione Utenti"
        description="Amministrazione account, ruoli e permessi di accesso"
        searchPlaceholder="Cerca email..."
        searchColumn="email"
        onAdd={handleAdd}
        addLabel="Nuovo Utente"
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
        fields={['email', 'role']}
        title="Importa Utenti"
        description="Carica un file CSV con le colonne: email, role, departmentCode (opzionale), isActive (SI/NO)"
      />

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifica Utente' : 'Nuovo Utente'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Modifica i dati dell\'account utente'
                : 'Crea un nuovo account utente nel sistema'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Username LDAP) *</FormLabel>
                    <FormControl>
                      <Input placeholder="nome.cognome@pef.it" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ruolo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona ruolo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {labels.roles[role as keyof typeof labels.roles] || role}
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Attivo</FormLabel>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dipartimento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || "none"}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona dipartimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessun Dipartimento</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Obbligatorio per utenti con ruolo &quot;Dipartimento&quot;
                    </FormDescription>
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
              Sei sicuro di voler eliminare l&apos;utente &quot;{selectedItem?.email}&quot;? 
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
