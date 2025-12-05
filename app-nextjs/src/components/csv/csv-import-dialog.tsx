'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Upload, FileText } from 'lucide-react'
import { parseCsv } from '@/lib/csv-utils'
import { toast } from 'sonner'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: Record<string, unknown>[]) => Promise<{ success: boolean; error?: string; count?: number }>
  title?: string
  description?: string
  fields: string[] // Expected fields names for validation
}

export function CsvImportDialog({
  open,
  onOpenChange,
  onImport,
  title = 'Importa dati da CSV',
  description = 'Carica un file CSV per importare i dati. Assicurati che le intestazioni corrispondano al modello.',
  fields,
}: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    setFile(null)
    setPreviewData([])
    setColumns([])
    setError(null)
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset()
    }
    onOpenChange(newOpen)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Per favore carica un file con estensione .csv')
      return
    }

    setFile(selectedFile)
    // setIsAnalyzing(true)
    setError(null)
    setValidationErrors([])

    try {
      const result = await parseCsv(selectedFile)
      
      if (result.errors.length > 0) {
        console.warn('CSV Parsing errors:', result.errors)
        // Some CSVs have trailing empty lines that cause "errors", we might ignore them if we got data
      }

      const rows = result.data
      const headers = result.meta.fields || []

      setPreviewData(rows.slice(0, 5)) // Preview first 5 rows
      setColumns(headers)

      // Validate headers
      const missingFields = fields.filter(f => !headers.includes(f))
      if (missingFields.length > 0) {
        setValidationErrors([
          `Il file manca delle seguenti colonne obbligatorie: ${missingFields.join(', ')}`
        ])
      } else if (rows.length === 0) {
        setError('Il file sembra vuoto')
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError('Errore durante la lettura del file: ' + message)
    } finally {
      // setIsAnalyzing(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    
    // Parse again or use stored data? Using parse again on full file to be safe or just pass result?
    // We didn't store full data in state to avoid memory issues with large files, so re-parse or use stored if small.
    // For now re-parsing is safer for the full set.
    
    try {
      const result = await parseCsv(file)
      const rows = result.data

      // Filter empty rows if any
      const validRows = rows.filter((r: Record<string, unknown>) => Object.values(r).some(v => v !== null && v !== ''))
      
      if (validRows.length === 0) {
        setError('Nessun dato valido trovato nel file.')
        setIsImporting(false)
        return
      }

      const importResult = await onImport(validRows)
      
      if (importResult.success) {
        toast.success(`Importazione completata: ${importResult.count} elementi importati.`)
        handleOpenChange(false)
      } else {
        setError(importResult.error || 'Errore durante l\'importazione')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError('Errore inaspettato durante l\'importazione: ' + message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!file ? (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600 font-medium">Clicca per selezionare un file CSV</p>
              <p className="text-xs text-slate-400 mt-1">Massimo 5MB</p>
              <Input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={isImporting}>
                  Cambia file
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errore</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Problemi nel file</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {!error && validationErrors.length === 0 && previewData.length > 0 && (
                <div className="rounded-md border p-4 bg-slate-50">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    File valido. Anteprima dati ({columns.length} colonne):
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b bg-slate-100">
                          {columns.map(c => <th key={c} className="p-2 font-medium text-slate-600">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i} className="border-b last:border-0 border-slate-200">
                            {columns.map(c => <td key={c} className="p-2 text-slate-600">{String(row[c] ?? '')}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    ... e altre righe
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Annulla
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || !!error || validationErrors.length > 0 || isImporting}
          >
             {isImporting ? 'Importazione in corso...' : 'Conferma Importazione'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
