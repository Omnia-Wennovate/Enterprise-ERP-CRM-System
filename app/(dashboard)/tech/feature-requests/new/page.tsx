'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import { PRIORITY_LABELS, DEPARTMENT_LABELS } from '@/types/tech'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { createFeatureRequest } from '@/lib/services/feature-requests'
import Link from 'next/link'

export default function NewFeatureRequestPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    priority: 'medium',
    due_date: '',
    estimated_effort: '',
    business_impact: '',
    notes: '',
  })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try {
      const p = JSON.parse(authUser)
      setProfile(p)
      // Auto-detect department from user profile
      if (p.department) {
        setForm(prev => ({ ...prev, department: p.department }))
      }
    } catch { router.push('/login') }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    if (!form.department) {
      setError('Department is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const request = await createFeatureRequest({
        title: form.title,
        description: form.description || undefined,
        department: form.department,
        priority: form.priority as any,
        due_date: form.due_date || undefined,
        estimated_effort: form.estimated_effort || undefined,
        business_impact: form.business_impact || undefined,
        notes: form.notes || undefined,
      }, profile.id)
      router.push(`/tech/feature-requests/${request.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit feature request')
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/tech/feature-requests" className="p-2 rounded-lg hover:bg-[#DBEAFE] transition-colors">
              <ArrowLeft size={20} className="text-[#4B6B7A]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Submit Feature Request</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Request a new feature or software improvement</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl">
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#0B1F33] mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Add bulk invoice export functionality"
                  className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A8FA8]/20 focus:border-[#0A8FA8]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#0B1F33] mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what you need and why. Include use cases, expected behavior, and any relevant context..."
                  rows={5}
                  className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A8FA8]/20 focus:border-[#0A8FA8] resize-none"
                />
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                    required
                  >
                    <option value="">Select department</option>
                    {Object.entries(DEPARTMENT_LABELS).filter(([k]) => k !== 'technology').map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Estimated Effort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Desired Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Estimated Effort</label>
                  <select
                    value={form.estimated_effort}
                    onChange={(e) => setForm({ ...form, estimated_effort: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  >
                    <option value="">Select effort level</option>
                    <option value="small">Small (1-2 days)</option>
                    <option value="medium">Medium (3-5 days)</option>
                    <option value="large">Large (1-2 weeks)</option>
                    <option value="xlarge">Extra Large (2+ weeks)</option>
                  </select>
                </div>
              </div>

              {/* Business Impact */}
              <div>
                <label className="block text-sm font-medium text-[#0B1F33] mb-1">Business Impact</label>
                <textarea
                  value={form.business_impact}
                  onChange={(e) => setForm({ ...form, business_impact: e.target.value })}
                  placeholder="How will this feature impact the business? (revenue, efficiency, customer satisfaction, etc.)"
                  rows={3}
                  className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A8FA8]/20 focus:border-[#0A8FA8] resize-none"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-[#0B1F33] mb-1">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional context, links, or references..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A8FA8]/20 focus:border-[#0A8FA8] resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
              <Link
                href="/tech/feature-requests"
                className="px-6 py-2.5 border border-[#BFDBFE] text-[#4B6B7A] rounded-lg hover:bg-[#F0F7FA] transition-colors text-sm font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
