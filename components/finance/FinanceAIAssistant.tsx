'use client'

import { useState } from 'react'
import { Sparkles, X, MessageSquare, Send } from 'lucide-react'
import type { InvoiceDetail } from '@/types/finance'

interface FinanceAIAssistantProps {
  invoice: InvoiceDetail
}

export function FinanceAIAssistant({ invoice }: FinanceAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Hello! I'm your Finance AI Assistant. I can help you analyze invoice ${invoice.invoice_number}, draft a reminder email, or explain the totals.` }
  ])

  const handleSend = () => {
    if (!query.trim()) return

    setMessages([...messages, { role: 'user', content: query }, { role: 'ai', content: 'This is a placeholder AI response. In a fully connected environment, I would generate insights based on your database schemas and Gemini API.' }])
    setQuery('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[600px] z-50">
      <div className="bg-teal-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Finance AI Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-teal-700 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-muted/20 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-card border border-border text-foreground'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-card flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
