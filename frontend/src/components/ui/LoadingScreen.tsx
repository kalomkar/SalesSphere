// SalesSphere AI – Loading Screen
import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
         style={{ background: 'rgb(var(--bg-primary))' }}>
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo icon */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="white" fillOpacity="0.3"/>
              <path d="M16 8L24 12V20L16 24L8 20V12L16 8Z" fill="white" fillOpacity="0.5"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          </motion.div>
          {/* Pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl"
            style={{ border: '2px solid #6366f1' }}
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text">SalesSphere AI</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Loading your dashboard...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 rounded-full overflow-hidden"
             style={{ background: 'rgb(var(--border-color))' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
