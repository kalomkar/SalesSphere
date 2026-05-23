// SalesSphere AI – Analytics Page
import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Sparkles,
  Search,
  TrendingDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts'
import { analyticsApi, productsApi } from '@/services/api'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface Performer {
  id: number
  name: string
  category: string
  revenue: number
  units: number
}

interface PerformanceProduct {
  id: number
  name: string
  category: string
  units_sold: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

interface Projection {
  month: string
  projected_revenue: number
  confidence_band_low: number
  confidence_band_high: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [categoryId, setCategoryId] = useState('')
  const [categoriesList, setCategoriesList] = useState([])
  const [profitExpense, setProfitExpense] = useState([])
  const [forecast, setForecast] = useState<Projection[]>([])
  const [forecastModel, setForecastModel] = useState('')
  const [performers, setPerformers] = useState<{ top_performers: Performer[]; weak_performers: Performer[] } | null>(null)
  const [productPerformance, setProductPerformance] = useState<PerformanceProduct[]>([])
  const [search, setSearch] = useState('')

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [peRes, foreRes, perfRes, prodRes, catRes] = await Promise.all([
        analyticsApi.getProfitExpense(year),
        analyticsApi.getForecast(),
        analyticsApi.getPerformers({ year }),
        analyticsApi.getProductPerformance({ year, category_id: categoryId || undefined }),
        productsApi.getCategories()
      ])

      setProfitExpense(peRes.data.data)
      setForecast(foreRes.data.projections)
      setForecastModel(foreRes.data.model)
      setPerformers(perfRes.data)
      setProductPerformance(prodRes.data.data)
      setCategoriesList(catRes.data.data || [])
    } catch {
      toast.error('Failed to load advanced analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [year, categoryId])

  if (loading) return <LoadingScreen />

  // Format currency
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

  // Filter products by search
  const filteredProducts = productPerformance.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Advanced Business Intelligence
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Detailed profitability analyses, sales forecasts, and product analytics.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex items-center gap-3">
          <select
            className="input py-2 px-4 text-xs"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="input py-2 px-4 text-xs"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categoriesList.map((c: { id: number; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Analysis Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Analysis Stacked Bar */}
        <div className="chart-container">
          <div className="mb-6">
            <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>Profitability Breakdown</h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Revenue vs. Production Cost vs. Net Profit</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitExpense} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: 'rgb(var(--bg-card))',
                    border: '1px solid rgb(var(--border-color))',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Gross Revenue" />
                <Bar dataKey="cost" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense / Cost" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sales Forecast Chart */}
        <div className="chart-container">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>6-Month Demand Forecasting</h4>
              <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Powered by: {forecastModel}</p>
            </div>
            <span className="badge badge-primary flex items-center gap-1 font-bold text-[10px] uppercase">
              <Sparkles size={11} /> AI Projecting
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: 'rgb(var(--bg-card))',
                    border: '1px solid rgb(var(--border-color))',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="projected_revenue" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} name="Projected Demand" />
                <Line type="monotone" dataKey="confidence_band_high" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Optimistic Range" />
                <Line type="monotone" dataKey="confidence_band_low" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Pessimistic Range" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top & Weak Performers */}
      {performers && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="card p-6">
            <h4 className="text-base font-black mb-1 flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <TrendingUp size={18} className="text-emerald-500" /> Top Selling Products
            </h4>
            <p className="text-xs mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>Highest generating items</p>
            <div className="space-y-4">
              {performers.top_performers.map((p) => (
                <div key={p.id} className="flex justify-between items-center border-b border-slate-500/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{p.category} • {p.units} units sold</p>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Performers */}
          <div className="card p-6">
            <h4 className="text-base font-black mb-1 flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <TrendingDown size={18} className="text-red-500" /> Slow Moving Products
            </h4>
            <p className="text-xs mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>Lowest generating items (needs review)</p>
            <div className="space-y-4">
              {performers.weak_performers.map((p) => (
                <div key={p.id} className="flex justify-between items-center border-b border-slate-500/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{p.category} • {p.units} units sold</p>
                  </div>
                  <span className="text-sm font-black text-red-400">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product performance comprehensive table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>Product Performance Matrix</h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Comprehensive gross sales, cost structure, and net margin</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-secondary))' }} />
            <input
              type="text"
              placeholder="Search matrix..."
              className="input pl-9 py-2 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.name}</td>
                  <td><span className="badge badge-primary">{p.category}</span></td>
                  <td>{p.units_sold}</td>
                  <td>{formatCurrency(p.revenue)}</td>
                  <td style={{ color: 'rgb(var(--text-secondary))' }}>{formatCurrency(p.cost)}</td>
                  <td className="font-semibold text-emerald-400">{formatCurrency(p.profit)}</td>
                  <td>
                    <span className={`badge ${
                      p.margin > 40 ? 'badge-success' :
                      p.margin > 20 ? 'badge-info' : 'badge-warning'
                    }`}>
                      {p.margin}%
                    </span>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-6">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
