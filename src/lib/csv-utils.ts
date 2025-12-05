import Papa from 'papaparse'

// Generic type for CSV data
export type CsvData = Record<string, string | number | boolean | null | undefined>

interface GenerateCsvOptions {
  filename: string
  columns: { header: string; accessor: string }[]
  data: Record<string, unknown>[]
}

/**
 * Downloads a CSV file generated from the provided data.
 */
export function downloadCsv({ filename, columns, data }: GenerateCsvOptions) {
  // Map data to CSV format based on columns
  const csvData = data.map((row) => {
    const csvRow: Record<string, unknown> = {}
    columns.forEach((col) => {
      // Handle nested accessors if needed (simple implementation for now)
      const value = row[col.accessor]
      csvRow[col.header] = value === null || value === undefined ? '' : value
    })
    return csvRow
  })

  // Use PapaParse to unparse (JSON to CSV)
  const csvString = Papa.unparse(csvData, {
    quotes: true, // Force quotes to avoid delimiter issues
  })

  // Create a Blob and trigger download
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' }) // Add BOM for Excel
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Generates a template CSV file with just headers.
 */
export function downloadCsvTemplate(filename: string, headers: string[]) {
  // Use columns array for specific fields if needed
  const csvString = Papa.unparse([], { 
    columns: headers, 
    quotes: true 
  })
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Parses a CSV string/file content.
 * Wraps PapaParse in a Promise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCsv(file: File): Promise<{ data: any[]; errors: any[]; meta: any }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Clean headers
      complete: (results) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve(results as any)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
