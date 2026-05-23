// SalesSphere AI – Reports & Exports Page
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Sparkles,
  DollarSign,
  ShoppingCart,
  Percent,
  Clock
} from 'lucide-react'
import { reportsApi, aiApi } from '@/services/api'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface SummaryStats {
  total_orders: number
  total_revenue: number
  total_discounts: number
  average_order_value: number
  period: {
    year: number
    month: string | null
  }
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState<number | string>('')
  const [summary, setSummary] = useState<SummaryStats | null>(null)

  // AI Generated Executive Summary
  const [aiReportLoading, setAiReportLoading] = useState(false)
  const [aiReport, setAiReport] = useState<string>('')

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getSummary({
        year,
        month: month || undefined
      })
      setSummary(res.data)
    } catch {
      toast.error('Failed to load report summary data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [year, month])

  const triggerExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      toast.loading(`Preparing your ${format.toUpperCase()} export...`, { id: 'export-toast' })
      const params = { year, month: month || undefined }
      let res

      if (format === 'pdf') {
        res = await reportsApi.exportPdf(params)
      } else if (format === 'excel') {
        res = await reportsApi.exportExcel(params)
      } else {
        res = await reportsApi.exportCsv(params)
      }

      // Download trigger
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'
      link.setAttribute('download', `sales_report_${year}_${month || 'full'}.${extension}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)

      toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: 'export-toast' })
    } catch {
      toast.error(`Export failed. Check backend plugins.`, { id: 'export-toast' })
    }
  }

  const handleGenerateAIReport = async () => {
    setAiReportLoading(true)
    try {
      const periodStr = month ? `Month ${month}, ${year}` : `Full Year ${year}`
      const res = await aiApi.generateReport('sales_performance', periodStr)
      setAiReport(res.data.report || res.data.content || 'No text insights generated.')
      toast.success('Grok AI Executive Summary Generated!')
    } catch {
      toast.error('AI Report generation failed.')
    } finally {
      setAiReportLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  if (loading && !summary) return <LoadingScreen />

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
          Document Center & Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
          Generate presentation-grade PDFs, download raw Excel worksheets, or produce AI executive summaries.
        </p>
      </div>

      {/* Configurations & Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1 space-y-5">
          <h3 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>Report Criteria</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-slate-400">Target Year</label>
              <select
                className="input py-2.5 text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block text-slate-400">Target Month</label>
              <select
                className="input py-2.5 text-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Full Year Summary</option>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick stats for criteria */}
        <div className="lg:col-span-2 card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-500/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Gross Sales Volume</p>
              <p className="text-lg font-black mt-0.5">{summary ? formatCurrency(summary.total_revenue) : '$0.00'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-500/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Completed Orders</p>
              <p className="text-lg font-black mt-0.5">{summary?.total_orders || 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-500/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Percent size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Total Discount Deductibles</p>
              <p className="text-lg font-black mt-0.5">{summary ? formatCurrency(summary.total_discounts) : '$0.00'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-500/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Avg Transaction Size</p>
              <p className="text-lg font-black mt-0.5">{summary ? formatCurrency(summary.average_order_value) : '$0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Format Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Card */}
        <motion.div whileHover={{ y: -2 }} className="card p-6 flex flex-col justify-between h-56">
          <div>
            <div className="w-10 h-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h4 className="text-base font-black text-slate-200">Executive PDF Document</h4>
            <p className="text-xs text-slate-400 mt-2">
              Presentation-grade layouts containing formatted revenue charts, regional summaries, and tables.
            </p>
          </div>
          <button
            onClick={() => triggerExport('pdf')}
            className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Download size={14} /> Download PDF
          </button>
        </motion.div>

        {/* Excel Card */}
        <motion.div whileHover={{ y: -2 }} className="card p-6 flex flex-col justify-between h-56">
          <div>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet size={20} />
            </div>
            <h4 className="text-base font-black text-slate-200">Interactive Excel Worksheet</h4>
            <p className="text-xs text-slate-400 mt-2">
              Includes double worksheets (Raw Transaction Stream + KPI Dashboard Sheets) with style color formatting.
            </p>
          </div>
          <button
            onClick={() => triggerExport('excel')}
            className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Download size={14} /> Download Spreadsheet
          </button>
        </motion.div>

        {/* CSV Card */}
        <motion.div whileHover={{ y: -2 }} className="card p-6 flex flex-col justify-between h-56">
          <div>
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h4 className="text-base font-black text-slate-200">Flat CSV Stream</h4>
            <p className="text-xs text-slate-400 mt-2">
              Standard comma-separated transaction row files. Optimized for custom script parsing or CRM pipeline imports.
            </p>
          </div>
          <button
            onClick={() => triggerExport('csv')}
            className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 mt-4"
          >
            <Download size={14} /> Download CSV
          </button>
        </motion.div>
      </div>

      {/* AI Smart Report Generator */}
      <div className="glass rounded-2xl p-6 border" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-base font-black flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <Sparkles size={18} className="text-indigo-400" /> Grok AI Performance Auditor
            </h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
              Generates executive commentaries regarding structural margins, regional velocities, and reorder levels.
            </p>
          </div>

          <button
            onClick={handleGenerateAIReport}
            disabled={aiReportLoading}
            className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 flex-shrink-0"
          >
            {aiReportLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                />
                Auditing...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate Executive Audit
              </>
            )}
          </button>
        </div>

        {aiReport ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl bg-slate-500/5 border border-slate-500/10 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto"
          >
            {aiReport}
          </motion.div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed rounded-xl border-slate-500/20">
            No audits compiled yet. Click the button above to query Grok AI.
          </div>
        )}
      </div>
    </div>
  )
}
