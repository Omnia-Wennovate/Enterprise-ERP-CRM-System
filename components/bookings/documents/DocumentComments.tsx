'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, User } from 'lucide-react'
import type { DocumentComment } from '@/types/documents'

export function DocumentComments({ documentId, currentUserId }: { documentId: string, currentUserId: string }) {
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load comments - stub
    setLoading(false)
  }, [documentId])

  const handleSend = () => {
    if (!newComment.trim()) return
    
    // Add comment - stub
    const comment: DocumentComment = {
      id: Date.now().toString(),
      document_id: documentId,
      author_id: currentUserId,
      author_name: 'Current User', // stub
      content: newComment,
      comment_type: 'comment',
      mentions: [],
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setComments([...comments, comment])
    setNewComment('')
  }

  return (
    <div className="flex flex-col h-full bg-muted/50 border border-border rounded-xl overflow-hidden">
      <div className="p-3 border-b border-border bg-card">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Comments & Activity
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No comments yet.
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                {c.author_name?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.author_name || 'System'}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className={`text-sm mt-1 p-2 rounded-lg ${
                  c.comment_type === 'approval_note' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                  c.comment_type === 'rejection_note' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                  'bg-card border border-border text-slate-700'
                }`}>
                  {c.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 bg-card border-t border-border">
        <div className="flex gap-2 relative">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full text-sm border-border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[40px] max-h-32 py-2 pr-10"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button 
            onClick={handleSend}
            disabled={!newComment.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-primary-foreground rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
