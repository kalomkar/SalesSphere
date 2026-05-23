// SalesSphere AI – Products Management Page
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Layers,
  MapPin
} from 'lucide-react'
import { productsApi } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  sku: string
  description: string
  category_id: number
  category: string
  price: number
  cost_price: number
  profit_margin: number
  stock_quantity: number
  reorder_level: number
  is_low_stock: boolean
  region: string
  is_active: boolean
}

interface Category {
  id: number
  name: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters state
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Stats state
  const [stats, setStats] = useState({
    total_products: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_categories: 0
  })

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    reorder_level: 5,
    region: 'All'
  })

  const fetchStats = async () => {
    try {
      const statsRes = await productsApi.getStats()
      setStats(statsRes.data)
    } catch {
      console.error('Failed to load stats')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll({
          page,
          search: search || undefined,
          category_id: selectedCategory || undefined,
          region: selectedRegion || undefined,
          low_stock: lowStockOnly ? 'true' : undefined
        }),
        productsApi.getCategories()
      ])

      setProducts(prodRes.data.data)
      setTotal(prodRes.data.total)
      setTotalPages(prodRes.data.pages)
      setCategories(catRes.data.data || [])
    } catch {
      toast.error('Failed to load products list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchStats()
  }, [page, selectedCategory, selectedRegion, lowStockOnly])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setForm({
      name: '',
      sku: '',
      description: '',
      category_id: categories[0]?.id.toString() || '',
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      reorder_level: 5,
      region: 'All'
    })
    setShowModal(true)
  }

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      category_id: p.category_id.toString(),
      price: p.price,
      cost_price: p.cost_price,
      stock_quantity: p.stock_quantity,
      reorder_level: p.reorder_level,
      region: p.region
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.sku || !form.category_id || form.price <= 0) {
      toast.error('Please enter valid fields.')
      return
    }

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, {
          ...form,
          category_id: Number(form.category_id)
        })
        toast.success('Product updated successfully!')
      } else {
        await productsApi.create({
          ...form,
          category_id: Number(form.category_id)
        })
        toast.success('New product cataloged!')
      }
      setShowModal(false)
      fetchProducts()
      fetchStats()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save product'
      toast.error(message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return
    try {
      await productsApi.delete(id)
      toast.success('Product deactivated successfully.')
      fetchProducts()
      fetchStats()
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  if (loading && products.length === 0) return <LoadingScreen />

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Products Inventory
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Manage warehouse inventory catalog, track SKU reorder levels, and audit item margins.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={handleOpenAdd}
            className="btn-primary flex items-center gap-2 self-start md:self-auto"
          >
            <Plus size={16} /> Catalog Product
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Catalog Items</p>
          <p className="text-2xl font-black mt-1">{stats.total_products}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Low Stock Warning</p>
          <p className="text-2xl font-black mt-1 text-amber-400">{stats.low_stock}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Out of Stock</p>
          <p className="text-2xl font-black mt-1 text-red-500">{stats.out_of_stock}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Categories</p>
          <p className="text-2xl font-black mt-1">{stats.total_categories}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-secondary))' }} />
            <input
              type="text"
              placeholder="Search products by SKU or Name..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="input pl-9 pr-6 py-2.5 text-xs"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="input pl-9 pr-6 py-2.5 text-xs"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-500/5 px-3 py-2 rounded-xl border border-slate-500/10">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 accent-indigo-500"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked)
                  setPage(1)
                }}
              />
              <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Low stock only</span>
            </label>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product Info</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit Cost</th>
                <th>Retail Price</th>
                <th>Margin</th>
                <th>Region</th>
                {isAdminOrManager && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.is_low_stock ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''}>
                  <td>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-[11px] truncate max-w-[200px]" style={{ color: 'rgb(var(--text-secondary))' }}>
                      {p.description || 'No description provided'}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>
                    <span className="badge badge-primary">{p.category}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{p.stock_quantity}</span>
                      {p.is_low_stock && (
                        <span className="text-amber-500" title={`Reorder level: ${p.reorder_level}`}>
                          <AlertTriangle size={14} className="animate-pulse" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td>${p.cost_price.toFixed(2)}</td>
                  <td className="font-semibold text-indigo-400">${p.price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.profit_margin > 30 ? 'badge-success' : 'badge-info'}`}>
                      {p.profit_margin}%
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info">{p.region}</span>
                  </td>
                  {isAdminOrManager && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="btn-ghost p-1.5 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-6">
                    No products cataloged matching these filter properties.
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
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total} products
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

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass max-w-lg w-full rounded-2xl border p-6 overflow-y-auto max-h-[90vh]"
              style={{ borderColor: 'rgba(99,102,241,0.2)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black" style={{ color: 'rgb(var(--text-primary))' }}>
                  {editingProduct ? 'Modify Product Catalog' : 'Catalog New Product'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-ghost p-1.5 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Product Name</label>
                    <input
                      type="text"
                      className="input py-2.5"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">SKU Code</label>
                    <input
                      type="text"
                      className="input py-2.5"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">Description</label>
                  <textarea
                    rows={3}
                    className="input py-2.5 resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Product Category</label>
                    <select
                      className="input py-2.5"
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      style={{ background: 'rgb(var(--bg-primary))' }}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Geographic Region</label>
                    <select
                      className="input py-2.5"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      style={{ background: 'rgb(var(--bg-primary))' }}
                    >
                      <option value="All">All Regions</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Unit Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input py-2.5"
                      value={form.cost_price}
                      onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Retail Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input py-2.5"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Profit Margin</label>
                    <div className="input py-2.5 text-slate-500 font-semibold bg-slate-500/5 select-none">
                      {form.price > 0 ? (
                        `${Math.round(((form.price - form.cost_price) / form.price) * 100)}%`
                      ) : (
                        '0%'
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Stock Quantity</label>
                    <input
                      type="number"
                      className="input py-2.5"
                      value={form.stock_quantity}
                      onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Reorder Threshold</label>
                    <input
                      type="number"
                      className="input py-2.5"
                      value={form.reorder_level}
                      onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 mt-4 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Package size={15} /> Save Catalog Details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
