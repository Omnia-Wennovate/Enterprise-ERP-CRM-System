'use client'

import { MoreVertical, Check, CheckCheck, Smile } from 'lucide-react'
import { useState } from 'react'

interface MessageBubbleProps {
  message: string
  sender: string
  timestamp: string
  isOwn?: boolean
  reactions?: Array<{ emoji: string; count: number; userReacted?: boolean }>
  isRead?: boolean
  isDelivered?: boolean
  showActions?: boolean
  onReact?: (emoji: string) => void
  onReply?: () => void
  onDelete?: () => void
}

export function MessageBubble({
  message,
  sender,
  timestamp,
  isOwn = false,
  reactions = [],
  isRead,
  isDelivered,
  showActions = true,
  onReact,
  onReply,
  onDelete,
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const emojis = ['👍', '❤️', '🎉', '👏', '👀', '😂', '😮', '😢']

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className="relative max-w-xs">
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-teal-600 text-white rounded-br-none'
              : 'bg-white text-slate-900 rounded-bl-none shadow'
          }`}
        >
          {!isOwn && <p className="text-xs font-semibold text-slate-600 mb-1">{sender}</p>}
          <p className="break-words">{message}</p>

          <div className="flex items-center justify-between gap-2 mt-1">
            <p className={`text-xs ${isOwn ? 'text-teal-100' : 'text-slate-500'}`}>
              {timestamp}
            </p>
            {isOwn && (
              <div className="flex items-center gap-0.5">
                {isRead ? (
                  <CheckCheck className="w-3 h-3" />
                ) : isDelivered ? (
                  <Check className="w-3 h-3" />
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => onReact?.(reaction.emoji)}
                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                  reaction.userReacted
                    ? 'bg-teal-100 text-teal-700'
                    : isOwn
                    ? 'bg-teal-500/20 text-teal-100 hover:bg-teal-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{reaction.emoji}</span>
                {reaction.count > 1 && <span>{reaction.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-lg p-1 z-10">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                title="Add reaction"
              >
                <Smile className="w-4 h-4 text-slate-600" />
              </button>

              {showEmojiPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg p-2 z-20">
                  <div className="grid grid-cols-4 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReact?.(emoji)
                          setShowEmojiPicker(false)
                        }}
                        className="text-lg hover:bg-slate-100 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-slate-600" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-20 min-w-max">
                  {onReply && (
                    <button
                      onClick={() => {
                        onReply()
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
                    >
                      Reply
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button
                      onClick={() => {
                        onDelete()
                        setShowMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
