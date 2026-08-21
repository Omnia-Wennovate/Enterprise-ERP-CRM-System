'use client'

import { useState } from 'react'
import { Search, MessageSquare, Users, Calendar, FileText } from 'lucide-react'

export default function CommunicationSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results] = useState([
    {
      id: 1,
      type: 'message',
      title: 'The booking is confirmed for next week',
      context: 'From: John Smith in Direct Messages',
      timestamp: '2 hours ago',
      icon: MessageSquare,
    },
    {
      id: 2,
      type: 'message',
      title: 'Can you review the proposal? It needs approval by Friday',
      context: 'From: Jane Doe in General Channel',
      timestamp: '4 hours ago',
      icon: MessageSquare,
    },
    {
      id: 3,
      type: 'meeting',
      title: 'Project Planning Meeting',
      context: 'Scheduled for Dec 22, 2024 at 2:00 PM',
      timestamp: '1 day away',
      icon: Calendar,
    },
    {
      id: 4,
      type: 'announcement',
      title: 'Payroll Completed',
      context: 'Posted by HR Department',
      timestamp: '1 day ago',
      icon: FileText,
    },
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Search Communications</h1>
          <p className="text-muted-foreground mt-2">Find messages, meetings, and announcements across your conversations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, channels, meetings..."
            className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-lg focus:outline-none focus:border-omnia-gold text-lg"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-3">
          {searchQuery && results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">Found {results.length} results</p>
              {results.map((result) => {
                const Icon = result.icon
                return (
                  <div
                    key={result.id}
                    className="bg-card rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-omnia-gold/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-omnia-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{result.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{result.context}</p>
                      <p className="text-xs text-muted-foreground mt-2">{result.timestamp}</p>
                    </div>
                  </div>
                )
              })}
            </>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Start typing to search your communications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
