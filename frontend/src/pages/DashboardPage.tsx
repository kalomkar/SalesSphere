// SalesSphere AI – Dashboard Page
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Cell,
  Pie
} from 'recharts'
import { dashboardApi } from '@/services/api'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface KPI {
  current: number
  previous?: number
  growth?: number
  margin?: number
}

interface SummaryData {
  revenue: KPI
  orders: KPI
  profit: KPI
  active_customers: number
  low_stock_count: number
  total_products: number
  total_users: number
}

interface RevenueData {
  month: string
  revenue: number
  orders: number
}

interface CategoryData {
  name: string
  color: string
  revenue: number
  units: number
  percentage: number
}

interface PredictionData {
  predicted_revenue: number
  last_month_revenue: number
  growth_forecast: number
  confidence: number
  model: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [recentSales, setRecentSales] = useState([])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [sumRes, revRes, catRes, predRes, recentRes] = await Promise.all([
        dashboardApi.getSummary(year, month),
        dashboardApi.getMonthlyRevenue(year),
        dashboardApi.getCategorySales(year, month),
        dashboardApi.getAIPrediction(),
        dashboardApi.getRecentSales(5)
      ])

      setSummary(sumRes.data)
      setMonthlyRevenue(revRes.data.data)
      setCategories(catRes.data.data)
      setPrediction(predRes.data)
      setRecentSales(recentRes.data.data)
    } catch {
      toast.error('Failed to load dashboard data. Starting backend first?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [year, month])

  if (loading || !summary) return <LoadingScreen />

  // Format currencies
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Dashboard Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Welcome back! Here's what's happening with your business this month.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-secondary))' }} />
            <select
              className="input pl-9 pr-6 py-2 text-xs"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              className="input py-2 px-4 text-xs"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="stat-card"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <DollarSign size={20} />
            </div>
            <span className={`badge ${summary.revenue.growth! >= 0 ? 'badge-success' : 'badge-danger'} flex items-center gap-0.5`}>
              {summary.revenue.growth! >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(summary.revenue.growth!)}%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>Total Revenue</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
              {formatCurrency(summary.revenue.current)}
            </h3>
            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
              vs {formatCurrency(summary.revenue.previous || 0)} last month
            </p>
          </div>
        </motion.div>

        {/* Orders */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="stat-card"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <ShoppingCart size={20} />
            </div>
            <span className={`badge ${summary.orders.growth! >= 0 ? 'badge-success' : 'badge-danger'} flex items-center gap-0.5`}>
              {summary.orders.growth! >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(summary.orders.growth!)}%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>Orders Completed</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
              {summary.orders.current}
            </h3>
            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
              vs {summary.orders.previous || 0} last month
            </p>
          </div>
        </motion.div>

        {/* Profit */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Percent size={20} />
            </div>
            <span className="badge badge-primary">
              {summary.profit.margin}% margin
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>Net Profit</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
              {formatCurrency(summary.profit.current)}
            </h3>
            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
              Net margin computed automatically
            </p>
          </div>
        </motion.div>

        {/* Low Stock Warning */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="stat-card"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle size={20} />
            </div>
            {summary.low_stock_count > 0 && (
              <span className="badge badge-danger">
                Action Required
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>Low Stock Alert</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: 'rgb(var(--text-primary))' }}>
              {summary.low_stock_count}
            </h3>
            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
              {summary.total_products} active products tracked
            </p>
          </div>
        </motion.div>
      </div>

      {/* AI Forecasting & Prediction Card */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-6 border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ borderColor: 'rgba(99,102,241,0.3)' }}
        >
          {/* Subtle glow */}
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full blur-3xl opacity-10"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
          <div className="flex items-start gap-4 z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 shadow-lg shadow-indigo-500/10 animate-pulse flex-shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black" style={{ color: 'rgb(var(--text-primary))' }}>Grok AI Revenue Projection</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">
                  Live AI
                </span>
              </div>
              <p className="text-sm mt-1 max-w-xl" style={{ color: 'rgb(var(--text-secondary))' }}>
                Based on historical multi-period sales patterns, Grok AI predicts next month's revenue to hit{' '}
                <strong className="text-indigo-400 font-bold">{formatCurrency(prediction.predicted_revenue)}</strong> with a{' '}
                <strong className="text-indigo-400 font-bold">{prediction.confidence}% confidence interval</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 min-w-[200px] z-10 border-l pl-6 border-indigo-500/20 md:border-l md:pl-6">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>Forecasted Growth</p>
              <div className="flex items-center gap-1.5 mt-1">
                {prediction.growth_forecast >= 0 ? (
                  <TrendingUp size={22} className="text-emerald-500" />
                ) : (
                  <TrendingUp size={22} className="text-red-500 transform rotate-180" />
                )}
                <span className={`text-2xl font-black ${prediction.growth_forecast >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {prediction.growth_forecast >= 0 ? '+' : ''}{prediction.growth_forecast}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="chart-container lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>Revenue & Order Trends</h4>
              <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Monthly performance analysis</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--bg-card))',
                    border: '1px solid rgb(var(--border-color))',
                    borderRadius: '12px',
                    color: 'rgb(var(--text-primary))'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>Product Categories</h4>
              <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Revenue contribution share</p>
            </div>
          </div>
          <div className="h-64 flex justify-center items-center relative">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="revenue"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      background: 'rgb(var(--bg-card))',
                      border: '1px solid rgb(var(--border-color))',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No category sales recorded this month.</p>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</span>
              <span className="text-lg font-black text-slate-300">
                {formatCurrency(categories.reduce((acc, c) => acc + c.revenue, 0))}
              </span>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categories.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-xs font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>{c.name} ({c.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sales & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent sales list */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>Recent Invoice Activity</h4>
              <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Latest invoices created in workspace</p>
            </div>
            <a href="/sales" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
              View All <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Region</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale: { id: number; invoice_number: string; customer_name: string; region: string; sale_date: string; total_amount: number; status: string }) => (
                  <tr key={sale.id}>
                    <td className="font-bold text-indigo-400">{sale.invoice_number}</td>
                    <td>{sale.customer_name}</td>
                    <td><span className="badge badge-info">{sale.region}</span></td>
                    <td style={{ color: 'rgb(var(--text-secondary))' }}>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="font-semibold">{formatCurrency(sale.total_amount)}</td>
                    <td>
                      <span className={`badge ${
                        sale.status === 'completed' ? 'badge-success' :
                        sale.status === 'pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-6">
                      No invoices recorded yet. Start by generating seed data!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick analytics insights panel */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-black mb-1" style={{ color: 'rgb(var(--text-primary))' }}>Quick Intelligence Panel</h4>
            <p className="text-xs mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>Automated business recommendations</p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                  Inventory Insight
                </span>
                <p className="text-xs mt-2" style={{ color: 'rgb(var(--text-primary))' }}>
                  {summary.low_stock_count > 0 ? (
                    `Alert: You have ${summary.low_stock_count} products falling below safety thresholds. Check reorder settings.`
                  ) : (
                    "Inventory levels look perfect. All tracked items are currently above restock levels."
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-500/5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  Revenue Growth
                </span>
                <p className="text-xs mt-2" style={{ color: 'rgb(var(--text-primary))' }}>
                  {summary.revenue.growth! >= 0 ? (
                    `Outstanding! Revenue is pacing ${summary.revenue.growth}% higher than last month's performance.`
                  ) : (
                    `Caution: Monthly sales are trailing ${Math.abs(summary.revenue.growth!)}% behind last month's results.`
                  )}
                </p>
              </div>
            </div>
          </div>

          <a href="/ai-assistant" className="btn-primary w-full text-xs py-3 mt-6 flex items-center justify-center gap-2">
            <Sparkles size={14} /> Open AI Consulting Room
          </a>
        </div>
      </div>
    </div>
  )
}
