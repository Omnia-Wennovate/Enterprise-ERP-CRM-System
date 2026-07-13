'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { authenticateUser, getAllDemoCredentials } from '@/lib/auth'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const demoCredentials = getAllDemoCredentials()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await authenticateUser(email, password)

      if (!result) {
        setError('Invalid email or password. Please try again.')
        setIsLoading(false)
        return
      }

      // Store auth info in localStorage for demo
      localStorage.setItem('auth_token', result.token)
      localStorage.setItem('auth_user', JSON.stringify(result.user))

      // Use setTimeout to ensure router is ready
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setIsLoading(true)
    setError('')

    const demoUser = demoCredentials.find((c) => c.email === demoEmail)
    if (demoUser) {
      const result = await authenticateUser(demoEmail, demoUser.password)
      if (result) {
        localStorage.setItem('auth_token', result.token)
        localStorage.setItem('auth_user', JSON.stringify(result.user))
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-[#BFDBFE] p-8">
        <h1 className="text-2xl font-semibold text-[#0B1F33] mb-2">Welcome back</h1>
        <p className="text-[#4B6B7A] text-sm mb-6">Sign in to your Omnia Travel account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#0B1F33] mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-[#4B6B7A]" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-[#BFDBFE] rounded-lg focus:border-[#0A8FA8] focus:ring-2 focus:ring-[#0A8FA8]/20 bg-white text-[#0B1F33] placeholder-[#94A3B8] transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#0B1F33] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#4B6B7A]" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-[#BFDBFE] rounded-lg focus:border-[#0A8FA8] focus:ring-2 focus:ring-[#0A8FA8]/20 bg-white text-[#0B1F33] placeholder-[#94A3B8] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#4B6B7A] hover:text-[#0B1F33] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-[#0A8FA8] hover:text-[#088096] transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0A8FA8] hover:bg-[#088096] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-[#DBEAFE] pt-6">
          <p className="text-xs text-[#4B6B7A] font-medium mb-3">Demo Credentials:</p>
          <div className="space-y-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.email}
                onClick={() => handleDemoLogin(cred.email)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-xs bg-[#F0F7FA] hover:bg-[#E0F2F7] border border-[#BFDBFE] rounded-lg transition-colors disabled:opacity-50 text-[#0B1F33]"
              >
                <span className="font-medium">
                  {cred.role === 'marketing' 
                    ? 'SOCIAL MEDIA TEAM' 
                    : cred.role.replace(/_/g, ' ').toUpperCase()}
                </span>
                <div className="text-[#4B6B7A] truncate">{cred.email}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-[#4B6B7A] mt-6">
          Don&apos;t have an account? <span className="text-[#0A8FA8] font-medium">Contact your admin</span>
        </p>
      </div>
    </div>
  )
}
