// SalesSphere AI – Administrator Console
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  Search,
  UserX,
  Edit2,
  X,
  Save,
  Briefcase
} from 'lucide-react'
import { usersApi } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface AdminUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
  is_active: boolean
  phone?: string
  department?: string
  created_at: string
}

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const isSystemAdmin = currentUser?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    managers: 0,
    employees: 0,
    viewers: 0
  })

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({
    name: '',
    role: 'employee',
    phone: '',
    department: '',
    is_active: true
  })

  const fetchStats = async () => {
    try {
      const statsRes = await usersApi.getStats()
      setStats(statsRes.data)
    } catch {
      console.error('Failed to load user stats.')
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await usersApi.getAll({
        page,
        search: search || undefined,
        role: selectedRole || undefined
      })
      setUsers(res.data.data)
      setTotal(res.data.total)
      setTotalPages(res.data.pages)
    } catch {
      toast.error('Failed to query user database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSystemAdmin) {
      fetchUsers()
      fetchStats()
    }
  }, [page, selectedRole])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      await usersApi.update(editingUser.id, form)
      toast.success('User updated successfully!')
      setShowEditModal(false)
      fetchUsers()
      fetchStats()
    } catch {
      toast.error('Failed to update user parameters.')
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this user account?')) return
    try {
      await usersApi.delete(id)
      toast.success('User deactivated.')
      fetchUsers()
      fetchStats()
    } catch {
      toast.error('Failed to deactivate user.')
    }
  }

  // Access check guard render
  if (!isSystemAdmin) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center space-y-4 page-enter">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-lg">
          <ShieldAlert size={28} className="animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-slate-200">Insufficient Privileges</h2>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          The Admin console is restricted to system administrators. Contact your security lead to request access elevation.
        </p>
      </div>
    )
  }

  if (loading && users.length === 0) return <LoadingScreen />

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
          Administrator Console
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
          Audit team identities, update permission profiles, and toggle account states.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Accounts</p>
          <p className="text-2xl font-black mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">System Admins</p>
          <p className="text-2xl font-black mt-1 text-indigo-400">{stats.admins}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Managers</p>
          <p className="text-2xl font-black mt-1">{stats.managers}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Employees</p>
          <p className="text-2xl font-black mt-1">{stats.employees}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user registry by name or email..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="input pl-9 pr-6 py-2.5 text-xs"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member Info</th>
                <th>Privileges</th>
                <th>Department</th>
                <th>Phone Contact</th>
                <th>Account Age</th>
                <th>Account State</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
                  <td>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge capitalize ${
                      u.role === 'admin' ? 'badge-danger' :
                      u.role === 'manager' ? 'badge-warning' :
                      u.role === 'viewer' ? 'badge-info' : 'badge-primary'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department || 'Unassigned'}</td>
                  <td>{u.phone || 'None'}</td>
                  <td className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn-ghost p-1.5 rounded-lg"
                        title="Edit Role/Profile"
                      >
                        <Edit2 size={13} />
                      </button>
                      {u.is_active && u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-400"
                          title="Suspend User Account"
                        >
                          <UserX size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-6">
                    No matching users found.
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
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total} accounts
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

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass max-w-md w-full rounded-2xl border p-6"
              style={{ borderColor: 'rgba(99,102,241,0.2)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black" style={{ color: 'rgb(var(--text-primary))' }}>
                  Update User Privileges
                </h3>
                <button onClick={() => setShowEditModal(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">User Identity Name</label>
                  <input
                    type="text"
                    className="input py-2.5"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Department</label>
                    <input
                      type="text"
                      className="input py-2.5"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Phone</label>
                    <input
                      type="text"
                      className="input py-2.5"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">System Role</label>
                    <select
                      className="input py-2.5"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      style={{ background: 'rgb(var(--bg-primary))' }}
                      disabled={editingUser.id === currentUser?.id}
                    >
                      <option value="employee">Employee</option>
                      <option value="viewer">Viewer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-400">Account Status</label>
                    <select
                      className="input py-2.5"
                      value={form.is_active ? 'true' : 'false'}
                      onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                      style={{ background: 'rgb(var(--bg-primary))' }}
                      disabled={editingUser.id === currentUser?.id}
                    >
                      <option value="true">Active</option>
                      <option value="false">Suspended</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 mt-4 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Save size={15} /> Save Settings
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
