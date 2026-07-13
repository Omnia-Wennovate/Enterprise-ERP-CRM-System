'use client'

import { useState } from 'react'
import { Calendar, Clock, Users, Plus, MapPin, Link as LinkIcon } from 'lucide-react'

export default function MeetingsPage() {
  const [meetings] = useState([
    {
      id: 1,
      title: 'Team Standup',
      date: 'Today',
      time: '10:00 AM',
      organizer: 'Jane Doe',
      participants: 8,
      location: 'Conference Room A',
      status: 'in_progress',
    },
    {
      id: 2,
      title: 'Project Planning',
      date: 'Dec 22, 2024',
      time: '2:00 PM',
      organizer: 'John Smith',
      participants: 5,
      location: 'Virtual (Teams)',
      status: 'scheduled',
    },
    {
      id: 3,
      title: 'Client Presentation',
      date: 'Dec 23, 2024',
      time: '3:30 PM',
      organizer: 'Robert Johnson',
      participants: 12,
      location: 'Main Office',
      status: 'scheduled',
    },
    {
      id: 4,
      title: 'Weekly Review',
      date: 'Dec 20, 2024',
      time: '4:00 PM',
      organizer: 'HR Department',
      participants: 20,
      location: 'Virtual (Zoom)',
      status: 'completed',
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meetings</h1>
            <p className="text-slate-600 mt-1">Schedule and manage team meetings</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Schedule Meeting
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button className="px-4 py-3 border-b-2 border-teal-600 text-teal-600 font-medium">
            Upcoming
          </button>
          <button className="px-4 py-3 text-slate-600 font-medium hover:text-slate-900">
            Past
          </button>
          <button className="px-4 py-3 text-slate-600 font-medium hover:text-slate-900">
            Calendar
          </button>
        </div>

        {/* Meetings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{meeting.title}</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                  {meeting.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{meeting.date}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{meeting.time}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{meeting.location}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{meeting.participants} participants</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600">Organizer: <span className="font-medium text-slate-900">{meeting.organizer}</span></p>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors font-medium text-sm">
                  Join
                </button>
                <button className="flex-1 px-3 py-2 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition-colors font-medium text-sm">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
