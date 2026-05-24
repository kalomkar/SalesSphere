import { Camera, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import { reportsApi } from '@/services/api'

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default function ExportToolbar() {
  const year = new Date().getFullYear()

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      toast.loading(`Exporting ${format.toUpperCase()}...`, { id: 'global-export' })
      const res = format === 'pdf'
        ? await reportsApi.exportPdf({ year })
        : format === 'excel'
          ? await reportsApi.exportExcel({ year })
          : await reportsApi.exportCsv({ year })
      const ext = format === 'excel' ? 'xlsx' : format
      downloadBlob(new Blob([res.data]), `salessphere_${format}_report.${ext}`)
      toast.success(`${format.toUpperCase()} exported`, { id: 'global-export' })
    } catch {
      toast.error('Export failed', { id: 'global-export' })
    }
  }

  const captureDashboard = async () => {
    try {
      toast.loading('Capturing dashboard screenshot...', { id: 'screenshot' })
      const target = document.querySelector('main') as HTMLElement
      const canvas = await html2canvas(target, { backgroundColor: null, scale: 2 })
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `salessphere_screenshot_${Date.now()}.png`)
        toast.success('Screenshot downloaded', { id: 'screenshot' })
      })
    } catch {
      toast.error('Screenshot failed', { id: 'screenshot' })
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      <button onClick={() => exportReport('pdf')} className="btn-secondary px-3 py-2 text-xs" title="Export PDF">
        <FileText size={14} /> PDF
      </button>
      <button onClick={() => exportReport('excel')} className="btn-secondary px-3 py-2 text-xs" title="Export Excel">
        <FileSpreadsheet size={14} /> Excel
      </button>
      <button onClick={() => exportReport('csv')} className="btn-secondary px-3 py-2 text-xs" title="Export CSV">
        <Download size={14} /> CSV
      </button>
      <button onClick={() => window.print()} className="btn-secondary px-3 py-2 text-xs" title="Print Report">
        <Printer size={14} /> Print
      </button>
      <button onClick={captureDashboard} className="btn-secondary px-3 py-2 text-xs" title="Download Dashboard Screenshot">
        <Camera size={14} /> Screenshot
      </button>
    </div>
  )
}
