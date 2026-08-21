'use client'

import { useState } from 'react'
import { MessageSquare, Lock, Send, Loader2 } from 'lucide-react'
import type { VisaCommunication } from '@/types/visa'

interface VisaCommunicationProps {
  messages: VisaCommunication[]
  visaApplicationId: string
  onSend: (msg: Partial<VisaCommunication>) => Promise<void>
}

export function VisaCommunicationPanel({ messages, visaApplicationId, onSend }: VisaCommunicationProps) {
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      await onSend({
        visa_application_id: visaApplicationId,
        content: content.trim(),
        is_internal: isInternal,
        message_type: isInternal ? 'internal_note' : 'comment',
      })
      setContent('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`p-3 rounded-xl ${msg.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50 border border-border'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{msg.author_name || 'System'}</span>
                  {msg.is_internal && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" /> INTERNAL
                    </span>
                  )}
                </div>
                <time className="text-[11px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsInternal(false)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!isInternal ? 'bg-omnia-gold/15 text-omnia-gold-dark' : 'bg-muted text-muted-foreground'}`}
          >
            Comment
          </button>
          <button
            onClick={() => setIsInternal(true)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${isInternal ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}
          >
            <Lock className="w-3 h-3" /> Internal Note
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border-border rounded-lg text-sm focus:border-omnia-gold focus:ring-teal-500"
            placeholder={isInternal ? 'Add internal note (hidden from customer)...' : 'Add a comment...'}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="px-4 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
