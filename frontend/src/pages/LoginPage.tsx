// SalesSphere AI – Login Page
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password, form.rememberMe)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: string) => {
    const credentials: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@salessphere.ai', password: 'admin123' },
      manager: { email: 'sarah@salessphere.ai', password: 'admin123' },
      employee: { email: 'mike@salessphere.ai', password: 'admin123' },
    }
    setForm({ ...form, ...credentials[role] })
  }

  return (
    <div className="min-h-screen flex gradient-hero">
      {/* Left – Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 flex-col justify-center px-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="absolute top-1/3 left-1/2 w-80 h-80 rounded-full blur-3xl opacity-20"
             style={{ background: '#6366f1' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-black text-white text-xl">SalesSphere AI</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-6 leading-tight">
            Your AI-powered<br />
            <span className="gradient-text">Sales Intelligence</span><br />
            platform awaits.
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Join 500+ companies transforming their sales data into strategic insights with Grok AI.
          </p>
          <div className="space-y-3">
            {['Real-time sales analytics', 'AI revenue forecasting', 'Smart report generation', 'Role-based team access'].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right – Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold gradient-text">SalesSphere AI</span>
          </div>

          <div className="glass rounded-2xl p-8 border"
               style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
              Welcome back
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
              Sign in to your SalesSphere account
            </p>

            {/* Demo credentials */}
            <div className="flex gap-2 mb-6">
              {['admin', 'manager', 'employee'].map((role) => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="flex-1 text-xs py-2 px-2 rounded-lg border capitalize hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                  style={{ borderColor: 'rgb(var(--border-color))', color: 'rgb(var(--text-secondary))' }}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-center mb-5" style={{ color: 'rgb(var(--text-secondary))' }}>
              ↑ Click to fill demo credentials
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-500">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block"
                       style={{ color: 'rgb(var(--text-secondary))' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgb(var(--text-secondary))' }} />
                  <input
                    id="login-email"
                    type="email"
                    className="input pl-10"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block"
                       style={{ color: 'rgb(var(--text-secondary))' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgb(var(--text-secondary))' }} />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600 accent-indigo-500"
                    checked={form.rememberMe}
                    onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                  />
                  <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'rgb(var(--text-secondary))' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
