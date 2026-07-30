'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Loader2, Pencil, Trash2, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createNote, getNotes, updateNote, deleteNote } from '@/lib/services/lead-notes'
import { logNoteAdded } from '@/lib/services/lead-activities'
import type { LeadNote } from '@/types/leads'

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  leadId: string
  currentUserId?: string
  currentUserName?: string
  refreshTrigger?: number
  onNoteAdded?: () => void
}

export function LeadNoteEditor({ leadId, currentUserId, currentUserName, refreshTrigger, onNoteAdded }: Props) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const data = await getNotes(leadId)
      setNotes(data)
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [leadId, refreshTrigger])

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setIsSaving(true)
    try {
      await createNote({
        lead_id: leadId,
        content: newContent.trim(),
        author_id: currentUserId || null,
        author_name: currentUserName || 'Team Member',
      })
      await logNoteAdded(leadId, currentUserId).catch(() => {})
      setNewContent('')
      await fetchNotes()
      onNoteAdded?.()
    } catch (err) {
      console.error('Failed to save note:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    try {
      await updateNote(id, editContent.trim())
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, content: editContent.trim() } : n))
      setEditingId(null)
    } catch (err) {
      console.error('Failed to update note:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try {
      await deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* New note editor */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add an internal note... Use @name to mention someone."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd()
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Ctrl+Enter to save</span>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newContent.trim() || isSaving}
            className="bg-teal-600 hover:bg-teal-700 text-white h-7 px-3 text-xs"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
            Post Note
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No notes yet</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {notes.map((note) => {
              const isOwn = note.author_id === currentUserId
              const initials = (note.author_name || 'TM').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-teal-700">{initials}</span>
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {note.author_name || 'Team Member'}
                        </span>
                        <span className="text-[11px] text-gray-400">{timeAgo(note.created_at)}</span>
                      </div>
                      {isOwn && editingId !== note.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(note.id); setEditContent(note.content) }}
                            className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1.5 text-sm border border-teal-300 rounded-lg outline-none resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEdit(note.id)} className="h-6 px-2 text-xs bg-teal-600 hover:bg-teal-700 text-white">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-6 px-2 text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    )}

                    {note.updated_at !== note.created_at && editingId !== note.id && (
                      <p className="text-[10px] text-gray-400 mt-1">edited</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
