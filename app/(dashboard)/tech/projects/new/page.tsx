'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '@/types/tech'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { createProject } from '@/lib/services/projects'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'planning',
    start_date: '',
    deadline: '',
    budget: 0,
    risk_level: 'low',
  })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    if (!form.name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const project = await createProject({
        name: form.name,
        description: form.description || undefined,
        priority: form.priority as any,
        status: form.status as any,
        start_date: form.start_date || undefined,
        deadline: form.deadline || undefined,
        budget: form.budget,
        risk_level: form.risk_level as any,
        owner_id: profile.id,
      }, profile.id)
      router.push(`/tech/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
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
            <Link href="/tech/projects" className="p-2 rounded-lg hover:bg-[#DBEAFE] transition-colors">
              <ArrowLeft size={20} className="text-[#4B6B7A]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Create New Project</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Set up a new software project</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl">
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6 space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-[#0B1F33] mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Omnia TravelOS v2.0"
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
                  placeholder="Describe the project objectives, scope, and deliverables..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0A8FA8]/20 focus:border-[#0A8FA8] resize-none"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  >
                    {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  />
                </div>
              </div>

              {/* Budget & Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1F33] mb-1">Risk Level</label>
                  <select
                    value={form.risk_level}
                    onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
                    className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
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
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
              <Link
                href="/tech/projects"
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
