'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Hash } from 'lucide-react'

export default function ChannelDetailPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: 'John Smith', content: 'Good morning everyone!', timestamp: '9:00 AM', avatar: 'JS' },
    { id: 2, sender: 'Jane Doe', content: 'Morning! Ready for the meeting?', timestamp: '9:05 AM', avatar: 'JD' },
    { id: 3, sender: 'Robert', content: 'All set here', timestamp: '9:10 AM', avatar: 'RJ' },
  ])

  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        sender: 'You',
        content: messageInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'YO',
      },
    ])
    setMessageInput('')
  }

  return (
    <div className="h-screen bg-[#F0F7FA] flex flex-col">
      {/* Channel Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Hash className="w-6 h-6 text-teal-600" />
          <div>
            <h2 className="font-semibold text-slate-900">general</h2>
            <p className="text-sm text-slate-600">24 members</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 font-semibold text-teal-700 text-sm">
              {msg.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{msg.sender}</p>
                <p className="text-xs text-slate-500">{msg.timestamp}</p>
              </div>
              <p className="text-slate-700 mt-1">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="flex items-end gap-3">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-500"
            />
            <button className="p-1 hover:bg-slate-200 rounded transition-colors">
              <Smile className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
