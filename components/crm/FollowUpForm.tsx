'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Mail,
  Users,
  Bell,
  CheckSquare,
  Loader2,
  CheckCircle2,
  Trash2,
  Calendar,
  Plus,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createFollowUp, getFollowUps, updateFollowUpStatus, deleteFollowUp } from '@/lib/services/lead-follow-ups'
import { logFollowUpScheduled } from '@/lib/services/lead-activities'
import type { LeadFollowUp, FollowUpType, LeadPriority, SalesAgent } from '@/types/leads'
import { FOLLOW_UP_TYPES, FOLLOW_UP_TYPE_LABELS, PRIORITIES, PRIORITY_LABELS } from '@/types/leads'

const TYPE_ICONS: Record<FollowUpType, React.ComponentType<{ className?: string }>> = {
  phone_call: Phone,
  email:      Mail,
  meeting:    Users,
  reminder:   Bell,
  task:       CheckSquare,
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-blue-100 text-blue-600',
  high:     'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
}

interface Props {
  leadId: string
  agents?: SalesAgent[]
  currentUserId?: string
  refreshTrigger?: number
  onFollowUpCreated?: () => void
}

export function FollowUpForm({ leadId, agents = [], currentUserId, refreshTrigger, onFollowUpCreated }: Props) {
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    follow_up_type: 'task' as FollowUpType,
    due_date: '',
    priority: 'medium' as LeadPriority,
    assigned_to: '',
  })

  const fetchFollowUps = async () => {
    setIsLoading(true)
    try {
      const data = await getFollowUps(leadId)
      setFollowUps(data)
    } catch (err) {
      console.error('Failed to load follow-ups:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchFollowUps() }, [leadId, refreshTrigger])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setIsSaving(true)
    try {
      await createFollowUp({
        lead_id: leadId,
        title: form.title,
        description: form.description || undefined,
        follow_up_type: form.follow_up_type,
        due_date: form.due_date || undefined,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
        created_by: currentUserId || null,
      })
      await logFollowUpScheduled(leadId, form.title, currentUserId).catch(() => {})
      setForm({ title: '', description: '', follow_up_type: 'task', due_date: '', priority: 'medium', assigned_to: '' })
      setShowForm(false)
      await fetchFollowUps()
      onFollowUpCreated?.()
    } catch (err) {
      console.error('Failed to create follow-up:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await updateFollowUpStatus(id, 'completed')
      setFollowUps((prev) => prev.map((f) => f.id === id ? { ...f, status: 'completed' } : f))
    } catch (err) {
      console.error('Failed to complete follow-up:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteFollowUp(id)
      setFollowUps((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      console.error('Failed to delete follow-up:', err)
    }
  }

  const isOverdue = (due: string | null) => due && new Date(due) < new Date()

  return (
    <div className="space-y-4">
      {/* Add Follow-up button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm((v) => !v)}
        className="w-full text-teal-700 border-teal-200 hover:bg-teal-50"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {showForm ? 'Cancel' : 'Schedule Follow-up'}
      </Button>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div>
              <input
                type="text"
                placeholder="Follow-up title *"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.follow_up_type}
                onChange={(e) => setForm((p) => ({ ...p, follow_up_type: e.target.value as FollowUpType }))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white outline-none focus:border-teal-400"
              >
                {FOLLOW_UP_TYPES.map((t) => (
                  <option key={t} value={t}>{FOLLOW_UP_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as LeadPriority }))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white outline-none focus:border-teal-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white outline-none focus:border-teal-400"
            />
            {agents.length > 0 && (
              <select
                value={form.assigned_to}
                onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white outline-none focus:border-teal-400"
              >
                <option value="">— Assign to agent —</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            )}
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-teal-400 outline-none resize-none"
            />
            <Button type="submit" size="sm" disabled={isSaving} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save Follow-up
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Follow-ups list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
        </div>
      ) : followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Clock className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No follow-ups scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {followUps.map((fu) => {
            const TypeIcon = TYPE_ICONS[fu.follow_up_type] || CheckSquare
            const overdue = isOverdue(fu.due_date) && fu.status === 'pending'
            return (
              <motion.div
                key={fu.id}
                layout
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  fu.status === 'completed'
                    ? 'bg-gray-50 border-gray-100 opacity-60'
                    : overdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200 hover:border-teal-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  fu.status === 'completed' ? 'bg-green-100' : 'bg-teal-100'
                }`}>
                  {fu.status === 'completed'
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <TypeIcon className="w-4 h-4 text-teal-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${fu.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {fu.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[fu.priority]}`}>
                      {fu.priority}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                      {FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]}
                    </span>
                    {fu.due_date && (
                      <span className={`text-[11px] flex items-center gap-0.5 ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(fu.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {fu.description && (
                    <p className="text-xs text-gray-500 mt-1">{fu.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {fu.status === 'pending' && (
                    <button
                      onClick={() => handleComplete(fu.id)}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(fu.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
