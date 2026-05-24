// SalesSphere AI – Dashboard Layout (Sidebar + Header)
import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BarChart3, Package, ShoppingCart, FileText,
  Bot, Bell, Settings, Users, ChevronLeft, ChevronRight,
  Sun, Moon, LogOut, Search, Menu, X, Sparkles, Database
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/services/api'
import ExportToolbar from '@/components/ui/ExportToolbar'
import clsx from 'clsx'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'employee', 'viewer'] },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'manager'] },
  { path: '/products', icon: Package, label: 'Products', roles: ['admin', 'manager'] },
  { path: '/sales', icon: ShoppingCart, label: 'Sales', roles: ['admin', 'manager', 'employee'] },
  { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'manager', 'viewer'] },
  { path: '/datasets', icon: Database, label: 'Datasets', roles: ['admin'] },
  { path: '/ai-assistant', icon: Bot, label: 'AI Assistant', roles: ['admin', 'manager', 'employee'] },
  { path: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'manager', 'employee', 'viewer'] },
  { path: '/admin', icon: Users, label: 'Admin', roles: ['admin'] },
  { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'manager', 'employee', 'viewer'] },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getAll({ unread_only: true, limit: 5 }),
    refetchInterval: 30000,
  })

  const unreadCount = notifData?.data?.unread_count || 0

  const filteredNav = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b',
        'border-[rgb(var(--border-color))]'
      )}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 pulse-glow"
             style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Sparkles size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {(sidebarOpen || mobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <span className="font-bold text-sm gradient-text">SalesSphere</span>
              <span className="text-xs block" style={{ color: 'rgb(var(--text-secondary))' }}>AI Analytics</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={clsx('nav-item relative', isActive && 'active')}
                title={!sidebarOpen && !mobileOpen ? item.label : ''}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {(sidebarOpen || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Notification badge */}
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 pb-4 border-t pt-4"
           style={{ borderColor: 'rgb(var(--border-color))' }}>
        <div className={clsx(
          'flex items-center gap-3 px-2 py-2 rounded-xl',
          'hover:bg-indigo-500/5 transition-colors cursor-pointer'
        )}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {(sidebarOpen || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                  {user?.name}
                </p>
                <p className="text-xs truncate capitalize" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {(sidebarOpen || mobileOpen) && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
              style={{ color: 'rgb(var(--text-secondary))' }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'rgb(var(--bg-primary))' }}>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col sidebar relative z-20 flex-shrink-0"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center
                     hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all z-30"
          style={{
            background: 'rgb(var(--bg-card))',
            borderColor: 'rgb(var(--border-color))',
            color: 'rgb(var(--text-secondary))',
          }}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-60 sidebar z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4"
                style={{ color: 'rgb(var(--text-secondary))' }}
              >
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 flex items-center gap-4 px-4 lg:px-6 nav-sticky flex-shrink-0 z-10"
                style={{ background: 'rgb(var(--bg-card))' }}>
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-indigo-500/10 transition-colors"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h2 className="text-sm font-semibold capitalize" style={{ color: 'rgb(var(--text-primary))' }}>
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-xl hover:bg-indigo-500/10 transition-colors"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              <Search size={18} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-indigo-500/10 transition-colors"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl hover:bg-indigo-500/10 transition-colors"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                 onClick={() => navigate('/settings')}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ExportToolbar />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
