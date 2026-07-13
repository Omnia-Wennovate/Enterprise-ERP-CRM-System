'use client'

import { Phone, Video, Info, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface ConversationHeaderProps {
  title: string
  subtitle?: string
  avatar?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  showActions?: boolean
  onCall?: () => void
  onVideoCall?: () => void
  onInfo?: () => void
}

export function ConversationHeader({
  title,
  subtitle,
  avatar,
  status = 'offline',
  showActions = true,
  onCall,
  onVideoCall,
  onInfo,
}: ConversationHeaderProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      default:
        return 'bg-slate-400'
    }
  }

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {avatar ? (
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700">
              {avatar}
            </div>
            {status !== 'offline' && (
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor()}`} />
            )}
          </div>
        ) : null}

        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2">
          {onCall && (
            <button
              onClick={onCall}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Start call"
            >
              <Phone className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Start video call"
            >
              <Video className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {onInfo && (
            <button
              onClick={onInfo}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Conversation info"
            >
              <Info className="w-5 h-5 text-slate-600" />
            </button>
          )}

          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  )
}
