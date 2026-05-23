// SalesSphere AI – Premium Landing Page
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Bot, Shield, TrendingUp, Globe, Star,
  ChevronDown, ArrowRight, Play, Check, Sparkles, Brain, FileText,
  Package, Menu, X, Sun, Moon, Mail, Phone, MapPin,
  Activity, Layers
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

// ── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const duration = 2000
          const step = Math.ceil(target / (duration / 16))
          const timer = setInterval(() => {
            start = Math.min(start + step, target)
            setCount(start)
            if (start >= target) clearInterval(timer)
          }, 16)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="card cursor-pointer overflow-hidden"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5">
        <span className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
          {question}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'rgb(var(--text-secondary))' }} />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed"
               style={{ color: 'rgb(var(--text-secondary))' }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Pricing Card ──────────────────────────────────────────────────────────────
function PricingCard({ plan, price, features, highlighted, badge }: {
  plan: string; price: string; features: string[]; highlighted?: boolean; badge?: string
}) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`relative rounded-2xl p-8 ${highlighted
        ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl'
        : 'card'
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
      <h3 className={`text-lg font-bold ${highlighted ? 'text-white' : ''}`}>{plan}</h3>
      <div className="mt-4 mb-6">
        <span className="text-4xl font-extrabold">{price}</span>
        {price !== 'Custom' && <span className="text-sm opacity-75">/month</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Check size={15} className={highlighted ? 'text-green-300' : 'text-green-500'} />
            <span className={highlighted ? 'text-white/90' : ''} style={!highlighted ? { color: 'rgb(var(--text-secondary))' } : {}}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate('/signup')}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          highlighted
            ? 'bg-white text-indigo-600 hover:bg-indigo-50'
            : 'btn-primary'
        }`}
      >
        Get Started
      </button>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { scrollY } = useScroll()

  const heroY = useTransform(scrollY, [0, 400], [0, -60])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.7])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'AI', href: '#ai' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ]

  const features = [
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Interactive charts powered by live data with 12+ visualization types including heatmaps, line, and pie charts.', color: '#6366f1' },
    { icon: Brain, title: 'AI Predictions', desc: 'Grok AI-powered forecasting engine predicts revenue, demand, and customer trends with 78%+ confidence.', color: '#8b5cf6' },
    { icon: FileText, title: 'Smart Reports', desc: 'Auto-generate PDF, Excel, and CSV reports with professional formatting and AI-generated summaries.', color: '#10b981' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Enterprise-grade security with JWT authentication and granular role permissions (Admin/Manager/Employee).', color: '#f59e0b' },
    { icon: Package, title: 'Inventory Management', desc: 'Track stock levels, set reorder alerts, manage 30+ product categories with AI restocking recommendations.', color: '#ec4899' },
    { icon: Globe, title: 'Multi-Region Support', desc: 'Analyze performance across North, South, East, and West regions with regional heatmap comparisons.', color: '#3b82f6' },
  ]

  const aiCapabilities = [
    { icon: Bot, title: 'AI Chatbot', desc: 'Ask business questions in plain English. Get data-driven answers instantly.' },
    { icon: TrendingUp, title: 'Revenue Forecast', desc: 'Predict next 6 months revenue using exponential smoothing + trend analysis.' },
    { icon: Sparkles, title: 'Smart Insights', desc: 'Auto-generated executive-level business summaries every morning.' },
    { icon: FileText, title: 'Report Generator', desc: 'AI writes your monthly sales report with recommendations.' },
    { icon: Activity, title: 'Voice Input', desc: 'Speak your questions using the built-in voice assistant interface.' },
    { icon: Layers, title: 'Recommendations', desc: 'Know which products to restock, promote, or discontinue automatically.' },
  ]

  const testimonials = [
    { name: 'Rahul Sharma', role: 'Sales Director, TechCorp India', avatar: 'R', text: 'SalesSphere AI transformed how we analyze sales. The AI predictions are remarkably accurate — saved us $120K in Q4 by recommending early restocking.', rating: 5 },
    { name: 'Emily Watson', role: 'CEO, RetailGiant US', avatar: 'E', text: 'The dashboard is beautiful and the AI assistant understands business context better than any tool I\'ve used. Setup took under 2 hours.', rating: 5 },
    { name: 'Arjun Patel', role: 'Analytics Manager, Flipkart', avatar: 'A', text: 'We replaced 3 separate BI tools with SalesSphere AI. The Grok AI integration gives insights we never had before. Absolutely outstanding.', rating: 5 },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg-primary))' }}>
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'nav-sticky shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm gradient-text">SalesSphere AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-indigo-500 transition-colors"
                style={{ color: 'rgb(var(--text-secondary))' }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-indigo-500/10 transition-colors"
                    style={{ color: 'rgb(var(--text-secondary))' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login" className="btn-ghost text-sm">Login</Link>
            <button onClick={() => navigate('/signup')} className="btn-primary text-sm px-5 py-2.5">
              Get Started <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden ml-auto"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden nav-sticky border-t px-4 py-4 space-y-2"
              style={{ borderColor: 'rgb(var(--border-color))' }}
            >
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="block py-2 text-sm font-medium"
                   style={{ color: 'rgb(var(--text-secondary))' }}
                   onClick={() => setMobileMenu(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="btn-secondary flex-1 text-center text-sm py-2.5">Login</Link>
                <Link to="/signup" className="btn-primary flex-1 text-center text-sm py-2.5">Sign Up</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden gradient-hero">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
             style={{ background: '#6366f1' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
             style={{ background: '#8b5cf6' }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 pt-20 pb-16 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6"
          >
            <Sparkles size={12} />
            Powered by Grok AI × Enterprise Analytics
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6"
          >
            Transform Sales
            <br />
            <span className="gradient-text">into Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SalesSphere AI is the enterprise analytics platform that turns your sales data
            into actionable insights using Grok AI — trusted by 500+ companies worldwide.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary px-8 py-4 text-base glow-primary"
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-8 py-4 rounded-xl border border-slate-600 text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-base"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Play size={14} fill="white" className="text-white ml-0.5" />
              </div>
              View Demo Dashboard
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { label: 'Companies', value: 500, suffix: '+' },
              { label: 'Monthly Revenue Tracked', value: 2.4, suffix: 'B+', prefix: '$' },
              { label: 'AI Predictions/Month', value: 100000, suffix: '+' },
              { label: 'Accuracy Rate', value: 94, suffix: '%' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} />
                </div>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={24} className="text-slate-500" />
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge badge-primary mb-4">Features</span>
            <h2 className="text-4xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
              Everything you need to
              <span className="gradient-text"> dominate sales</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgb(var(--text-secondary))' }}>
              Built for enterprise teams. Scales from 10 to 10,000 employees without compromise.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                     style={{ background: `${feat.color}20`, color: feat.color }}>
                  <feat.icon size={22} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>{feat.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Capabilities ──────────────────────────────────────────────── */}
      <section id="ai" className="py-24 px-4 lg:px-6 relative overflow-hidden">
        <div className="absolute inset-0"
             style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge badge-primary mb-4">
              <Bot size={12} /> AI Powered
            </span>
            <h2 className="text-4xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
              Meet your <span className="gradient-text">AI Business Analyst</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgb(var(--text-secondary))' }}>
              Powered by Grok AI (xAI) — the same technology trusted by enterprise teams globally.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiCapabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 border hover:border-indigo-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <cap.icon size={20} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>{cap.title}</h3>
                <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
              Loved by <span className="gradient-text">industry leaders</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star key={s} size={14} fill="#f59e0b" className="text-amber-500" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: 'rgb(var(--text-secondary))' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 lg:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
              Simple, <span className="gradient-text">transparent pricing</span>
            </h2>
            <p className="text-lg" style={{ color: 'rgb(var(--text-secondary))' }}>
              No hidden fees. Cancel anytime.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <PricingCard
              plan="Starter"
              price="$29"
              features={['Up to 5 users', 'Basic analytics', '3 reports/month', 'Email support', '5 product categories']}
            />
            <PricingCard
              plan="Professional"
              price="$99"
              badge="Most Popular"
              highlighted
              features={['Up to 25 users', 'Full AI suite', 'Unlimited reports', 'Priority support', 'All categories', 'Grok AI chatbot', 'Revenue forecasting']}
            />
            <PricingCard
              plan="Enterprise"
              price="Custom"
              features={['Unlimited users', 'Custom AI models', 'White-label option', 'Dedicated manager', 'SLA guarantee', 'API access', 'Custom integrations']}
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 lg:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </motion.div>
          <div className="space-y-3">
            {[
              { q: 'What is SalesSphere AI?', a: 'SalesSphere AI is an enterprise-grade sales analytics platform combining React dashboards, Python Flask APIs, MySQL database, and Grok AI for intelligent business insights and forecasting.' },
              { q: 'How does the AI work?', a: 'We integrate with Grok AI (xAI) API to provide contextual business analysis. The AI understands your sales data and provides natural language insights, forecasts, and recommendations.' },
              { q: 'Is my data secure?', a: 'Yes. We use JWT authentication, role-based access control, encrypted database storage, and industry-standard security practices. Your data never leaves your infrastructure in the self-hosted version.' },
              { q: 'Can I export my data?', a: 'Absolutely. Export your sales data as PDF reports (with charts), Excel spreadsheets (with formatting), or raw CSV files — all with a single click.' },
              { q: 'What roles are available?', a: 'Three roles: Admin (full access + user management), Manager (analytics + reports + sales), and Employee (limited sales view). Each role has carefully controlled permissions.' },
              { q: 'Does it work on mobile?', a: 'Yes! SalesSphere AI is fully responsive and optimized for all screen sizes. A PWA version allows you to install it on your phone for instant access.' },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <FAQItem question={faq.q} answer={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
                Get in <span className="gradient-text">Touch</span>
              </h2>
              <p className="mb-8" style={{ color: 'rgb(var(--text-secondary))' }}>
                Ready to transform your sales analytics? Talk to our team today.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Mail, text: 'hello@salessphere.ai' },
                  { icon: Phone, text: '+1 (555) 000-0000' },
                  { icon: MapPin, text: 'San Francisco, CA, USA' },
                ].map((contact, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <contact.icon size={18} />
                    </div>
                    <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{contact.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card p-8"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Your Name
                  </label>
                  <input
                    className="input"
                    placeholder="John Smith"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Email Address
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="john@company.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Message
                  </label>
                  <textarea
                    className="input resize-none"
                    rows={4}
                    placeholder="Tell us about your use case..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <button
                  className="btn-primary w-full py-3.5"
                  onClick={() => {
                    alert('Message sent! We\'ll get back to you within 24 hours.')
                    setContactForm({ name: '', email: '', message: '' })
                  }}
                >
                  Send Message <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12 px-4 lg:px-6" style={{ borderColor: 'rgb(var(--border-color))' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="font-bold text-sm gradient-text">SalesSphere AI</span>
              </div>
              <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Enterprise sales intelligence powered by artificial intelligence.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Dashboard', 'Analytics', 'AI Assistant', 'Reports'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-sm mb-4" style={{ color: 'rgb(var(--text-primary))' }}>{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-indigo-500 transition-colors"
                         style={{ color: 'rgb(var(--text-secondary))' }}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
               style={{ borderColor: 'rgb(var(--border-color))' }}>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              © 2024 SalesSphere AI. All rights reserved.
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              Built with ❤️ using React, Flask, MySQL & Grok AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
