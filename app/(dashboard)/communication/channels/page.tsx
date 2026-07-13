'use client'

import { useState } from 'react'
import { Plus, Hash, Lock, Users } from 'lucide-react'
import Link from 'next/link'

export default function ChannelsPage() {
  const [channels] = useState([
    { id: '1', name: 'general', description: 'Company-wide discussions', icon: Hash, members: 24, isPrivate: false },
    { id: '2', name: 'sales', description: 'Sales team updates', icon: Hash, members: 8, isPrivate: false },
    { id: '3', name: 'operations', description: 'Ops and logistics', icon: Hash, members: 6, isPrivate: false },
    { id: '4', name: 'finance', description: 'Finance discussions', icon: Hash, members: 5, isPrivate: false },
    { id: '5', name: 'hr', description: 'HR announcements', icon: Lock, members: 4, isPrivate: true },
    { id: '6', name: 'management', description: 'Executive team', icon: Lock, members: 3, isPrivate: true },
  ])

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Channels</h1>
            <p className="text-slate-600 mt-1">Team collaboration channels</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Create Channel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => {
            const IconComponent = channel.icon
            return (
              <Link
                key={channel.id}
                href={`/communication/channels/${channel.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                    {channel.isPrivate ? (
                      <Lock className="w-6 h-6 text-teal-600" />
                    ) : (
                      <IconComponent className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      #{channel.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">{channel.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {channel.members} members
                      </div>
                      {channel.isPrivate && (
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">Private</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
