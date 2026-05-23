// SalesSphere AI – Forgot Password Page
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSubmitted(true)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to request reset link'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex gradient-hero items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold gradient-text">SalesSphere AI</span>
        </div>

        <div className="glass rounded-2xl p-8 border"
             style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
          {!submitted ? (
            <>
              <h2 className="text-2xl font-black mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                Forgot Password
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
                We'll email you instructions to reset your password.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-500">{error}</span>
                </div>
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
                      type="email"
                      className="input pl-10"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
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
                      Sending Link...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Reset Instructions <ArrowRight size={16} />
                    </span>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-2xl font-black mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                Reset Email Sent
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
                If that email exists on our platform, we have sent password reset instructions to it.
              </p>
            </div>
          )}

          <p className="text-center text-sm mt-6" style={{ color: 'rgb(var(--text-secondary))' }}>
            Remember your password?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
