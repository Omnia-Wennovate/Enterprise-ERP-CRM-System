'use client'

import { useState } from 'react'
import { Search, Plus, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'

export default function DirectMessagesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState([
    {
      id: '1',
      participantName: 'John Smith',
      lastMessage: 'The booking is confirmed for next week',
      timestamp: '2 hours ago',
      unread: true,
      avatar: 'JS',
      status: 'online',
    },
    {
      id: '2',
      participantName: 'Jane Doe',
      lastMessage: 'Can you review the proposal?',
      timestamp: '4 hours ago',
      unread: true,
      avatar: 'JD',
      status: 'online',
    },
    {
      id: '3',
      participantName: 'Robert Johnson',
      lastMessage: 'Thanks for the update',
      timestamp: '1 day ago',
      unread: false,
      avatar: 'RJ',
      status: 'away',
    },
  ])

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Direct Messages</h1>
            <p className="text-muted-foreground mt-1">One-on-one conversations with team members</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark font-medium">
            <Plus className="w-5 h-5" />
            New Message
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1 bg-card rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                />
              </div>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/communication/dm/${conv.id}`}
                  className="p-4 hover:bg-muted/50 transition-colors block"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-omnia-gold/15 flex items-center justify-center font-semibold text-omnia-gold-dark">
                        {conv.avatar}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                          conv.status === 'online'
                            ? 'bg-green-500'
                            : conv.status === 'away'
                            ? 'bg-yellow-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${conv.unread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                          {conv.participantName}
                        </p>
                        {conv.unread && (
                          <div className="w-2 h-2 rounded-full bg-omnia-gold" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Empty State */}
          <div className="md:col-span-2 bg-card rounded-lg shadow p-12 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { MessageSquare } from 'lucide-react'
