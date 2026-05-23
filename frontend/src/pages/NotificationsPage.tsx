// SalesSphere AI – Notifications Center
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { notificationsApi } from '@/services/api'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'ai_insight'
  is_read: boolean
  action_url?: string
  created_at: string
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await notificationsApi.getAll()
      setNotifications(res.data.data || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch {
      toast.error('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to mark read.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('All marked as read!')
    } catch {
      toast.error('Failed to update all.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.delete(id)
      setNotifications(notifications.filter((n) => n.id !== id))
      toast.success('Notification cleared.')
      fetchNotifications()
    } catch {
      toast.error('Failed to clear notification.')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-emerald-400" size={18} />
      case 'warning':
        return <AlertTriangle className="text-amber-400" size={18} />
      case 'error':
        return <AlertTriangle className="text-red-500" size={18} />
      case 'ai_insight':
        return <Sparkles className="text-indigo-400" size={18} />
      default:
        return <Info className="text-blue-400" size={18} />
    }
  }

  if (loading && notifications.length === 0) return <LoadingScreen />

  return (
    <div className="space-y-8 page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Notifications Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Stay updated with inventory stock warnings, transaction logs, and Grok AI suggestions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="card p-6">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl border flex gap-4 transition-all ${
                  n.is_read ? 'bg-slate-500/5 border-slate-500/10' : 'bg-indigo-500/5 border-indigo-500/20 glow-sm'
                }`}
              >
                {/* Left icon depending on type */}
                <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={`text-sm font-bold ${n.is_read ? 'text-slate-300' : 'text-slate-100'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>

                  {/* Actions row */}
                  <div className="flex items-center gap-3 pt-2">
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        Mark as read <ArrowRight size={10} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-[10px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto text-slate-400">
                  <Bell size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-400">All caught up!</h4>
                <p className="text-xs max-w-xs mx-auto">No notifications currently in your queue.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
