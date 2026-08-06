'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Smile, Paperclip, Phone, Video, Info } from 'lucide-react'

export default function DirectMessageDetailPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'John Smith',
      content: 'Hey, how are you doing?',
      timestamp: '10:30 AM',
      isOwn: false,
    },
    {
      id: 2,
      sender: 'You',
      content: 'Hey! Doing great, thanks for asking. How about you?',
      timestamp: '10:32 AM',
      isOwn: true,
    },
    {
      id: 3,
      sender: 'John Smith',
      content: 'The booking is confirmed for next week',
      timestamp: '10:35 AM',
      isOwn: false,
    },
  ])

  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    const newMessage = {
      id: messages.length + 1,
      sender: 'You',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    }

    setMessages([...messages, newMessage])
    setMessageInput('')
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700">
            JS
          </div>
          <div>
            <h2 className="font-semibold text-foreground">John Smith</h2>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Video className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.isOwn
                  ? 'bg-teal-600 text-primary-foreground rounded-br-none'
                  : 'bg-card text-foreground rounded-bl-none shadow'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.isOwn ? 'text-teal-100' : 'text-muted-foreground'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border px-6 py-4">
        <div className="flex items-end gap-3">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
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
              className="flex-1 bg-transparent outline-none text-foreground placeholder-slate-500"
            />
            <button className="p-1 hover:bg-slate-200 rounded transition-colors">
              <Smile className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-2 bg-teal-600 text-primary-foreground rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
