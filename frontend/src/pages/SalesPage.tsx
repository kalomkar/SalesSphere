// SalesSphere AI – Sales & Invoicing Page
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Trash2,
  X,
  CreditCard,
  User,
  Phone,
  Mail,
  Eye
} from 'lucide-react'
import { salesApi, productsApi } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface SaleItem {
  id?: number
  product_id: number
  product_name?: string
  quantity: number
  unit_price: number
  discount: number
  total: number
}

interface Sale {
  id: number
  invoice_number: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  region: string
  status: string
  payment_method: string
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  notes?: string
  sale_date: string
  salesperson?: string
  items: SaleItem[]
}

interface Product {
  id: number
  name: string
  price: number
  stock_quantity: number
}

export default function SalesPage() {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [payment, setPayment] = useState('')

  // Modal control
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activeSale, setActiveSale] = useState<Sale | null>(null)

  // Add Sale Form State
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [formRegion, setFormRegion] = useState('North')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [notes, setNotes] = useState('')
  const [formItems, setFormItems] = useState<Partial<SaleItem>[]>([
    { product_id: 0, quantity: 1, unit_price: 0, discount: 0, total: 0 }
  ])

  // Stats
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0
  })

  const fetchStats = async () => {
    try {
      const statsRes = await salesApi.getStats()
      setStats({
        total_orders: statsRes.data.total_orders,
        total_revenue: statsRes.data.total_revenue
      })
    } catch {
      console.error('Failed to load sales stats')
    }
  }

  const fetchSalesAndProducts = async () => {
    try {
      setLoading(true)
      const [salesRes, prodRes] = await Promise.all([
        salesApi.getAll({
          page,
          search: search || undefined,
          status: status || undefined,
          region: region || undefined,
          payment_method: payment || undefined
        }),
        productsApi.getAll({ per_page: 100 })
      ])

      setSales(salesRes.data.data)
      setTotal(salesRes.data.total)
      setTotalPages(salesRes.data.pages)
      setProducts(prodRes.data.data || [])
    } catch {
      toast.error('Failed to fetch sales dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesAndProducts()
    fetchStats()
  }, [page, status, region, payment])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchSalesAndProducts()
  }

  const handleOpenDetail = (sale: Sale) => {
    setActiveSale(sale)
    setShowDetailModal(true)
  }

  const handleAddRow = () => {
    setFormItems([...formItems, { product_id: 0, quantity: 1, unit_price: 0, discount: 0, total: 0 }])
  }

  const handleRemoveRow = (idx: number) => {
    const next = [...formItems]
    next.splice(idx, 1)
    setFormItems(next)
  }

  const handleItemChange = (idx: number, field: keyof SaleItem, val: number) => {
    const next = [...formItems]
    const row = { ...next[idx] }

    if (field === 'product_id') {
      const p = products.find((x) => x.id === val)
      row.product_id = val
      row.unit_price = p ? p.price : 0
      row.discount = 0
    } else {
      row[field] = val as never
    }

    const qty = row.quantity || 1
    const price = row.unit_price || 0
    const disc = row.discount || 0
    row.total = (price * qty) - disc

    next[idx] = row
    setFormItems(next)
  }

  // Calculations for new sale
  const itemsSubtotal = formItems.reduce((acc, x) => acc + (x.total || 0), 0)
  const taxAmount = Math.round(itemsSubtotal * 0.08 * 100) / 100
  const finalTotal = itemsSubtotal + taxAmount

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName) {
      toast.error('Customer name is required')
      return
    }

    const cleanItems = formItems.filter((x) => x.product_id && x.product_id > 0)
    if (cleanItems.length === 0) {
      toast.error('At least one catalog item must be selected')
      return
    }

    // Verify stock availability
    for (const item of cleanItems) {
      const p = products.find((x) => x.id === item.product_id)
      if (p && p.stock_quantity < (item.quantity || 1)) {
        toast.error(`Not enough inventory for "${p.name}". Stock left: ${p.stock_quantity}`)
        return
      }
    }

    try {
      await salesApi.create({
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        customer_phone: customerPhone || undefined,
        region: formRegion,
        payment_method: paymentMethod,
        notes: notes || undefined,
        items: cleanItems.map((x) => ({
          product_id: x.product_id,
          quantity: x.quantity,
          unit_price: x.unit_price,
          discount: x.discount
        }))
      })

      toast.success('Sale successfully logged!')
      setShowAddModal(false)
      fetchSalesAndProducts()
      fetchStats()

      // Reset Form
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setFormRegion('North')
      setPaymentMethod('card')
      setNotes('')
      setFormItems([{ product_id: 0, quantity: 1, unit_price: 0, discount: 0, total: 0 }])
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to register sale'
      toast.error(message)
    }
  }

  const handleCancelSale = async (id: number) => {
    if (!confirm('Are you sure you want to void / cancel this invoice? This will restore item inventory.')) return
    try {
      await salesApi.cancel(id)
      toast.success('Invoice successfully voided.')
      setShowDetailModal(false)
      fetchSalesAndProducts()
      fetchStats()
    } catch {
      toast.error('Insufficient permissions to cancel invoice.')
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  if (loading && sales.length === 0) return <LoadingScreen />

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Invoices & Sales Activity
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Browse invoice history, record regional storefront transactions, and cancel invoices.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={16} /> Record Transaction
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cumulative Gross Sales</p>
          <p className="text-2xl font-black mt-1 text-emerald-400">{formatCurrency(stats.total_revenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Orders Logged</p>
          <p className="text-2xl font-black mt-1">{stats.total_orders}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Average Order Size</p>
          <p className="text-2xl font-black mt-1">
            {stats.total_orders > 0 ? formatCurrency(stats.total_revenue / stats.total_orders) : '$0.00'}
          </p>
        </div>
      </div>

      {/* Filters Form */}
      <div className="card p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer email, name, invoice ID..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              className="input px-4 py-2 text-xs w-32"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="input px-4 py-2 text-xs w-32"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Region</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>

            <select
              className="input px-4 py-2 text-xs w-36"
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Payment Method</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="card p-6">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Salesperson</th>
                <th>Region</th>
                <th>Payment</th>
                <th>Tax</th>
                <th>Final Total</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-mono font-bold text-indigo-400">{sale.invoice_number}</td>
                  <td>
                    <div className="font-bold">{sale.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{sale.customer_email || 'No Email'}</div>
                  </td>
                  <td style={{ color: 'rgb(var(--text-secondary))' }}>{sale.salesperson}</td>
                  <td>
                    <span className="badge badge-info">{sale.region}</span>
                  </td>
                  <td className="capitalize text-xs">{sale.payment_method.replace('_', ' ')}</td>
                  <td>${sale.tax.toFixed(2)}</td>
                  <td className="font-black text-slate-200">{formatCurrency(sale.total_amount)}</td>
                  <td>
                    <span className={`badge ${
                      sale.status === 'completed' ? 'badge-success' :
                      sale.status === 'pending' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleOpenDetail(sale)}
                      className="btn-ghost p-1.5 rounded-lg flex items-center gap-1.5 ml-auto"
                    >
                      <Eye size={13} /> View Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-6">
                    No transactions registered matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass max-w-3xl w-full rounded-2xl border p-6 overflow-y-auto max-h-[90vh]"
              style={{ borderColor: 'rgba(99,102,241,0.2)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black" style={{ color: 'rgb(var(--text-primary))' }}>
                  Record Storefront Transaction
                </h3>
                <button onClick={() => setShowAddModal(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRecordSale} className="space-y-6">
                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Customer Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="input pl-9 py-2"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        className="input pl-9 py-2"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        className="input pl-9 py-2"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Geographic Region</label>
                    <select
                      className="input py-2"
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value)}
                      style={{ background: 'rgb(var(--bg-primary))' }}
                    >
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Payment Method</label>
                    <select
                      className="input py-2"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ background: 'rgb(var(--bg-primary))' }}
                    >
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="online">Online Payment</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Line Items</label>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Line Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          className="input py-2 flex-1 text-xs"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', Number(e.target.value))}
                          style={{ background: 'rgb(var(--bg-primary))' }}
                        >
                          <option value="0">Choose product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.price} - stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Qty"
                          className="input py-2 w-16 text-center text-xs"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        />

                        <input
                          type="number"
                          placeholder="Disc ($)"
                          className="input py-2 w-20 text-center text-xs"
                          value={item.discount}
                          onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                        />

                        <div className="w-20 text-right font-semibold text-xs px-2">
                          ${(item.total || 0).toFixed(2)}
                        </div>

                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="btn-ghost p-2 text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-500/10">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Additional Invoice Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Add terms, shipping details, or internal memos..."
                      className="input py-2 resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 flex flex-col justify-center">
                    <div className="flex justify-between text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                      <span>Subtotal:</span>
                      <span>${itemsSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                      <span>Sales Tax (8%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black border-t border-dashed border-slate-500/20 pt-2 text-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-indigo-400">${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <CreditCard size={15} /> Finalize and Print Invoice
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {showDetailModal && activeSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass max-w-2xl w-full rounded-2xl border p-6 overflow-y-auto"
              style={{ borderColor: 'rgba(99,102,241,0.2)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-indigo-400">{activeSale.invoice_number}</h3>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Registered on {new Date(activeSale.sale_date).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Bill To:</p>
                  <p className="text-sm font-black mt-1 text-slate-200">{activeSale.customer_name}</p>
                  <p className="text-xs text-slate-400">{activeSale.customer_email || 'No email associated'}</p>
                  <p className="text-xs text-slate-400">{activeSale.customer_phone || 'No phone associated'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Transaction Details:</p>
                  <p className="text-xs text-slate-300 mt-1">Region: <span className="badge badge-info">{activeSale.region}</span></p>
                  <p className="text-xs text-slate-300">Payment: <span className="capitalize">{activeSale.payment_method}</span></p>
                  <p className="text-xs text-slate-300">Salesperson: {activeSale.salesperson}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="table-container mb-6">
                <table>
                  <thead>
                    <tr>
                      <th>Product Catalog Item</th>
                      <th>Quantity</th>
                      <th>Unit Retail</th>
                      <th>Discounts</th>
                      <th className="text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSale.items.map((item, index) => (
                      <tr key={index}>
                        <td className="font-bold text-slate-300">{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.unit_price.toFixed(2)}</td>
                        <td className="text-red-400">-${item.discount.toFixed(2)}</td>
                        <td className="text-right font-bold">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Additional Memos:</p>
                  <p className="text-xs mt-1 text-slate-400 bg-slate-500/5 p-3 rounded-lg border border-slate-500/10">
                    {activeSale.notes || 'No memos attached to this storefront invoice.'}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal:</span>
                    <span>${activeSale.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tax (8%):</span>
                    <span>${activeSale.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-slate-500/10 pt-2 text-slate-200">
                    <span>Invoice Total:</span>
                    <span className="text-indigo-400">{formatCurrency(activeSale.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isAdminOrManager && activeSale.status === 'completed' && (
                <div className="mt-8 pt-4 border-t border-slate-500/10 flex justify-end">
                  <button
                    onClick={() => handleCancelSale(activeSale.id)}
                    className="btn-ghost flex items-center gap-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl px-4 py-2 border border-red-500/20"
                  >
                    <Trash2 size={13} /> Void / Refund Invoice
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
