'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, Bell, Plus } from 'lucide-react'

export default function AnnouncementsPage() {
  const [announcements] = useState([
    {
      id: 1,
      title: 'Payroll Completed',
      content: 'Salaries for December have been processed and will be deposited by December 28th.',
      category: 'payroll_completed',
      priority: 'normal',
      author: 'HR Department',
      date: 'Dec 20, 2024',
      read: true,
    },
    {
      id: 2,
      title: 'Visa Regulation Update',
      content: 'New visa policies for international employees effective January 1st. Please review the attached documents.',
      category: 'visa_regulation',
      priority: 'high',
      author: 'HR Department',
      date: 'Dec 19, 2024',
      read: true,
    },
    {
      id: 3,
      title: 'Office Holiday Schedule',
      content: 'Office will be closed December 24-26 for Christmas. Happy Holidays!',
      category: 'holiday_notice',
      priority: 'normal',
      author: 'Management',
      date: 'Dec 15, 2024',
      read: false,
    },
    {
      id: 4,
      title: 'Emergency Protocol Update',
      content: 'All staff must review updated emergency protocols. Certification required by January 10th.',
      category: 'emergency',
      priority: 'urgent',
      author: 'Management',
      date: 'Dec 10, 2024',
      read: false,
    },
  ])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'emergency':
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
            <p className="text-slate-600 mt-1">Company-wide announcements and important updates</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            New Announcement
          </button>
        </div>

        {/* Unread count */}
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
          <Bell className="w-5 h-5 text-teal-600" />
          <p className="text-teal-900">You have 2 unread announcements</p>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-lg p-6 transition-colors ${
                announcement.read ? 'bg-white' : 'bg-teal-50'
              } shadow hover:shadow-lg cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getPriorityIcon(announcement.priority)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`font-semibold ${announcement.read ? 'text-slate-900' : 'text-slate-900 font-bold'}`}>
                        {announcement.title}
                      </h3>
                      <p className="text-slate-700 mt-2">{announcement.content}</p>

                      <div className="flex items-center gap-3 mt-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        <span className="text-sm text-slate-500">{announcement.author}</span>
                        <span className="text-sm text-slate-400">{announcement.date}</span>
                      </div>
                    </div>
                    {!announcement.read && (
                      <div className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
