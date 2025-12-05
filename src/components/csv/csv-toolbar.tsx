'use client'

import { Button } from '@/components/ui/button'
import { Download, FileDown, Upload } from 'lucide-react'

interface CsvToolbarProps {
  onExport: () => void
  onDownloadTemplate: () => void
  onImportClick: () => void
  exportDisabled?: boolean
  importDisabled?: boolean
}

export function CsvToolbar({
  onExport,
  onDownloadTemplate,
  onImportClick,
  exportDisabled = false,
  importDisabled = false,
}: CsvToolbarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button variant="outline" size="sm" onClick={onDownloadTemplate} title="Scarica Modello CSV">
        <FileDown className="w-4 h-4 mr-2" />
        Modello
      </Button>
      <Button variant="outline" size="sm" onClick={onImportClick} disabled={importDisabled} title="Importa da CSV">
        <Upload className="w-4 h-4 mr-2" />
        Importa
      </Button>
      <div className="h-6 w-px bg-slate-200 mx-2" />
      <Button variant="outline" size="sm" onClick={onExport} disabled={exportDisabled} title="Esporta in CSV">
        <Download className="w-4 h-4 mr-2" />
        Esporta
      </Button>
    </div>
  )
}
