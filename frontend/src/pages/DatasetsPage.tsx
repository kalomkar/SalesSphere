import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CheckCircle2, Database, Download, FileSpreadsheet, Upload, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { datasetsApi } from '@/services/api'

interface Dataset {
  id: number
  name: string
  source: string
  file_name: string
  file_type: string
  row_count: number
  column_count: number
  columns: string[]
  field_map: Record<string, string>
  quality_report: Record<string, number>
  analysis: {
    monthly_sales?: { month: string; sales: number }[]
    product_analysis?: { product: string; sales: number; quantity?: number }[]
    regional_analysis?: { region: string; sales: number }[]
    product_demand?: { product: string; quantity: number }[]
    profit_analysis?: { total_profit: number; profit_margin: number }
  }
  created_at: string
}

interface Preview {
  file_name: string
  row_count: number
  column_count: number
  columns: string[]
  field_map: Record<string, string>
  quality_report: Record<string, number>
  preview: Record<string, string>[]
  valid: boolean
}

const sourceOptions = [
  { id: 'amazon_sales', label: 'Amazon Sales Dataset' },
  { id: 'superstore_sales', label: 'Superstore Sales Dataset' },
  { id: 'retail_store', label: 'Retail Store Dataset' },
]

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [source, setSource] = useState('amazon_sales')
  const [loading, setLoading] = useState(false)

  const selected = useMemo(() => datasets.find((d) => d.id === selectedId) || datasets[0], [datasets, selectedId])

  const loadDatasets = async () => {
    const res = await datasetsApi.getAll()
    setDatasets(res.data.data || [])
    if (!selectedId && res.data.data?.[0]) setSelectedId(res.data.data[0].id)
  }

  useEffect(() => {
    loadDatasets().catch(() => toast.error('Failed to load datasets'))
  }, [])

  const handlePreview = async () => {
    if (!file) return toast.error('Choose a CSV or Excel file first')
    setLoading(true)
    try {
      const res = await datasetsApi.preview(file)
      setPreview(res.data)
      toast.success(res.data.valid ? 'Dataset validated and mapped' : 'Preview generated; mapping needs review')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImportFile = async () => {
    if (!file) return toast.error('Choose a file first')
    setLoading(true)
    try {
      await datasetsApi.importFile(file, file.name, preview?.file_name || 'upload')
      toast.success('Dataset imported and analyzed')
      setFile(null)
      setPreview(null)
      await loadDatasets()
    } catch {
      toast.error('Dataset import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImportSource = async () => {
    setLoading(true)
    try {
      await datasetsApi.importSource(source)
      toast.success('Retail dataset imported from built-in sales data')
      await loadDatasets()
    } catch {
      toast.error('Source import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExportJson = async (id: number) => {
    const res = await datasetsApi.exportJson(id)
    const url = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `dataset_analysis_${id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatNumber = (value = 0) => new Intl.NumberFormat('en-US').format(value)
  const formatCurrency = (value = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Dataset Intelligence Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Upload CSV/Excel, import Amazon/Superstore/Retail datasets, validate fields, clean missing values, and analyze sales patterns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="font-black">Upload Dataset</h3>
              <p className="text-xs text-slate-400">CSV or Excel supported</p>
            </div>
          </div>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div className="grid grid-cols-2 gap-3">
            <button disabled={loading || !file} onClick={handlePreview} className="btn-secondary py-2 text-xs">
              <Wand2 size={14} /> Preview
            </button>
            <button disabled={loading || !file} onClick={handleImportFile} className="btn-primary py-2 text-xs">
              <Upload size={14} /> Import
            </button>
          </div>

          {preview && (
            <div className="rounded-xl border border-slate-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 size={14} /> {preview.valid ? 'Format Validated' : 'Preview Ready'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>Rows: {formatNumber(preview.row_count)}</span>
                <span>Columns: {preview.column_count}</span>
                <span>Missing filled: {preview.quality_report.missing_values_filled || 0}</span>
                <span>Duplicates: {preview.quality_report.removed_duplicates || 0}</span>
              </div>
              <div className="text-xs">
                <p className="font-bold mb-2">Auto Field Map</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(preview.field_map).map(([k, v]) => (
                    <span key={k} className="badge badge-primary">{k}: {v}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-500/10 space-y-3">
            <h3 className="font-black flex items-center gap-2"><Database size={16} /> Import Source</h3>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              {sourceOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button disabled={loading} onClick={handleImportSource} className="btn-secondary w-full py-2 text-xs">
              <FileSpreadsheet size={14} /> Import Kaggle/Retail Source
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black">Saved Imported Datasets</h3>
              <span className="badge badge-info">{datasets.length} saved</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Rows</th>
                    <th>Columns</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={dataset.id}>
                      <td className="font-bold">{dataset.name}</td>
                      <td><span className="badge badge-primary">{dataset.source}</span></td>
                      <td>{formatNumber(dataset.row_count)}</td>
                      <td>{dataset.column_count}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-ghost px-2 py-1" onClick={() => setSelectedId(dataset.id)}>Analyze</button>
                          <button className="btn-ghost px-2 py-1" onClick={() => handleExportJson(dataset.id)}>
                            <Download size={13} /> JSON
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {datasets.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-500 py-8">No datasets imported yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -2 }} className="card p-6">
                <h3 className="font-black flex items-center gap-2 mb-4"><BarChart3 size={16} /> Monthly Sales</h3>
                <div className="space-y-2">
                  {(selected.analysis.monthly_sales || []).slice(-8).map((item) => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-slate-400">{item.month}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-500/10 overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, item.sales / 2000)}%` }} />
                      </div>
                      <span className="w-28 text-right text-xs font-bold">{formatCurrency(item.sales)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="card p-6">
                <h3 className="font-black mb-4">Product Demand</h3>
                <div className="space-y-2">
                  {(selected.analysis.product_demand || selected.analysis.product_analysis || []).slice(0, 8).map((item) => (
                    <div key={item.product} className="flex justify-between text-sm">
                      <span className="truncate max-w-[70%]">{item.product}</span>
                      <span className="font-bold text-indigo-400">{'quantity' in item ? formatNumber(item.quantity) : formatCurrency(item.sales)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="card p-6">
                <h3 className="font-black mb-4">Regional Analysis</h3>
                <div className="space-y-2">
                  {(selected.analysis.regional_analysis || []).map((item) => (
                    <div key={item.region} className="flex justify-between text-sm">
                      <span>{item.region}</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(item.sales)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="card p-6">
                <h3 className="font-black mb-4">Profit Analysis</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-500/10 p-4">
                    <p className="text-xs text-slate-400">Total Profit</p>
                    <p className="text-xl font-black text-emerald-400">{formatCurrency(selected.analysis.profit_analysis?.total_profit || 0)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-500/10 p-4">
                    <p className="text-xs text-slate-400">Margin</p>
                    <p className="text-xl font-black">{selected.analysis.profit_analysis?.profit_margin || 0}%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
