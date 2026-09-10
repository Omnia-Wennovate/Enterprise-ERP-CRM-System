'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OmniaLogo } from '@/components/ui/OmniaLogo'
import { motion } from 'framer-motion'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.cookie = 'demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      localStorage.removeItem('demo_role')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    if (cleanEmail.includes('@gamil.com')) {
      setError('Did you mean @gmail.com? Please check your email spelling.')
      setIsLoading(false)
      return
    }

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (signInError || !authData.user) {
      setError(signInError?.message ?? 'Invalid email or password. Please try again.')
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-[#E8E4DC]/60 p-8 lg:p-10 relative overflow-hidden">
        {/* Subtle luxury corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C8A951]/[0.04] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#C8A951]/[0.03] to-transparent pointer-events-none" />

        {/* Logo for desktop (hidden on mobile since it's in the page header) */}
        <div className="hidden lg:flex justify-center mb-6">
          <div className="relative">
            <OmniaLogo variant="icon" theme="dark" size={120} />
          </div>
        </div>

        {/* Gold accent line */}
        <div className="w-10 h-[2px] bg-gradient-to-r from-[#C8A951] to-[#E8D48B] mx-auto mb-6" />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0A1221] mb-1.5 tracking-tight">Welcome back</h1>
          <p className="text-[#5A6475] text-sm">Sign in to your Omnia Travel account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-[#0A1221]/70 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3 text-[#8A94A5] transition-colors group-focus-within:text-[#C8A951]" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or username"
                className="w-full pl-11 pr-4 py-3 border border-[#E5E2DC] rounded-xl focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 bg-white/90 text-[#0A1221] placeholder-[#8A94A5] transition-all text-sm shadow-sm"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-[#0A1221]/70 uppercase tracking-widest">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3 text-[#8A94A5] transition-colors group-focus-within:text-[#C8A951]" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 pr-11 py-3 border border-[#E5E2DC] rounded-xl focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 bg-white/90 text-[#0A1221] placeholder-[#8A94A5] transition-all text-sm shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#8A94A5] hover:text-[#C8A951] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-4 h-4 rounded border border-[#E5E2DC] bg-white peer-checked:bg-[#C8A951] peer-checked:border-[#C8A951] transition-all"></div>
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-[#5A6475] group-hover:text-[#0A1221] transition-colors">Remember me</span>
            </label>

            <a href="/forgot-password" className="text-xs font-medium text-[#5A6475] hover:text-[#C8A951] transition-colors">
              Forgot Password?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5"
            >
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Sign In Button — premium gold gradient */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#C8A951] via-[#D4B85C] to-[#C8A951] hover:from-[#B39540] hover:via-[#C8A951] hover:to-[#B39540] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-[0_4px_20px_rgba(200,169,81,0.3)] hover:shadow-[0_6px_30px_rgba(200,169,81,0.4)] mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1 opacity-70">
                  <path d="M3.3335 8H12.6668M12.6668 8L8.66683 4M12.6668 8L8.66683 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
