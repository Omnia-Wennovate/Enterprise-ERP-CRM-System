'use client'

import { useState } from 'react'
import { X, Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated?: () => void
}

const DEMO_USERS = [
  { email: 'admin@omniatravel.com', password: 'admin@123', role: 'Super Admin' },
  { email: 'sales@omniatravel.com', password: 'sales@123', role: 'Sales Agent' },
  { email: 'ops@omniatravel.com', password: 'ops@123', role: 'Operations' },
  { email: 'finance@omniatravel.com', password: 'finance@123', role: 'Accountant' },
  { email: 'hr@omniatravel.com', password: 'hr@123', role: 'HR Manager' },
  { email: 'customer@omniatravel.com', password: 'customer@123', role: 'Customer' },
]

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [autoConfirm, setAutoConfirm] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdUsers, setCreatedUsers] = useState<string[]>([])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }

      // Call Supabase API to create user
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, autoConfirm }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create user')
        setIsLoading(false)
        return
      }

      setSuccess(`User ${email} created successfully`)
      setCreatedUsers([...createdUsers, email])
      setEmail('')
      setPassword('')

      if (onUserCreated) onUserCreated()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDemoUser = async (demoEmail: string, demoPassword: string) => {
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword, autoConfirm: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create user')
        setIsLoading(false)
        return
      }

      setSuccess(`Demo user ${demoEmail} created successfully`)
      setCreatedUsers([...createdUsers, demoEmail])

      if (onUserCreated) onUserCreated()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create a new user</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Manual User Creation Form */}
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@omniatravel.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A8FA8] focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A8FA8] focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoConfirm"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-[#0A8FA8]"
                disabled={isLoading}
              />
              <label htmlFor="autoConfirm" className="text-sm font-medium text-slate-700">
                Auto confirm user?
              </label>
            </div>

            <p className="text-sm text-slate-600">
              A confirmation email will not be sent when creating a user via this form.
            </p>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 bg-[#0A8FA8] text-white font-medium rounded-lg hover:bg-[#076B85] transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create user
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-600">Or create demo users</span>
            </div>
          </div>

          {/* Demo Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEMO_USERS.map((user) => {
              const isCreated = createdUsers.includes(user.email)
              return (
                <button
                  key={user.email}
                  onClick={() => handleCreateDemoUser(user.email, user.password)}
                  disabled={isLoading || isCreated}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isCreated
                      ? 'bg-green-50 border-green-300'
                      : 'bg-[#F0F7FA] border-[#BFDBFE] hover:border-[#0A8FA8] hover:bg-[#E0F2F7]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">{user.role}</p>
                      <p className="text-xs text-slate-600 truncate">{user.email}</p>
                    </div>
                    {isCreated && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
