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
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Search Communications</h1>
          <p className="text-slate-600 mt-2">Find messages, meetings, and announcements across your conversations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, channels, meetings..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-lg"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-3">
          {searchQuery && results.length > 0 ? (
            <>
              <p className="text-sm text-slate-600 mb-4">Found {results.length} results</p>
              {results.map((result) => {
                const Icon = result.icon
                return (
                  <div
                    key={result.id}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{result.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{result.context}</p>
                      <p className="text-xs text-slate-400 mt-2">{result.timestamp}</p>
                    </div>
                  </div>
                )
              })}
            </>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Start typing to search your communications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
