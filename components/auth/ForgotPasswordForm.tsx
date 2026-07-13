'use client'

import { useState } from 'react'
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsSubmitted(true)
      setEmail('')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    setIsSubmitted(false)
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-[#BFDBFE] p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-50 rounded-full p-3">
              <CheckCircle className="text-[#10B981]" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-[#0B1F33] text-center mb-2">Check your email</h1>
          <p className="text-[#4B6B7A] text-center text-sm mb-4">
            We&apos;ve sent a password reset link to <span className="font-medium text-[#0B1F33]">{email}</span>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#0B2A3D]">
              Check your email and click the reset link. The link will expire in 24 hours.
            </p>
          </div>

          <button
            onClick={handleResend}
            className="w-full text-center text-sm text-[#0A8FA8] hover:text-[#088096] font-medium py-2 transition-colors"
          >
            Didn&apos;t receive it? <span className="underline">Resend email</span>
          </button>

          <div className="mt-6 pt-6 border-t border-[#DBEAFE]">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-[#0A8FA8] hover:text-[#088096] transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-[#BFDBFE] p-8">
        <Link
          href="/login"
          className="flex items-center gap-1 text-[#0A8FA8] hover:text-[#088096] transition-colors text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <h1 className="text-2xl font-semibold text-[#0B1F33] mb-2">Reset your password</h1>
        <p className="text-[#4B6B7A] text-sm mb-6">
          Enter your email and we will send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#0B1F33] mb-2">
              Email address
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Send Reset Link Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0A8FA8] hover:bg-[#088096] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
