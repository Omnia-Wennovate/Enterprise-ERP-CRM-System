'use client'

import { useState, useRef } from 'react'
import { Send, Paperclip, Smile, Mic } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!message.trim()) return
    onSend(message)
    setMessage('')
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-4">
      <div className="flex items-end gap-3">
        <button
          disabled={disabled}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-500 disabled:opacity-50"
          />
          <button
            disabled={disabled}
            className="p-1 hover:bg-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add emoji"
          >
            <Smile className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <button
          disabled={disabled}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send voice message"
          onClick={() => setIsRecording(!isRecording)}
        >
          <Mic className={`w-5 h-5 ${isRecording ? 'text-red-600' : 'text-slate-600'}`} />
        </button>

        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {isRecording && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Recording voice message...
        </div>
      )}
    </div>
  )
}
