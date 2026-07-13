'use client'

import { useState } from 'react'
import { Bell, X, Check } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  icon?: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Invoice Paid',
    message: 'Invoice #INV-2024-001 has been paid in full',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: 'New Lead',
    message: 'Sarah added a new lead: Acme Corporation',
    timestamp: '4 hours ago',
    read: false,
  },
  {
    id: '3',
    title: 'Visa Approved',
    message: 'Visa for booking #BK-2024-156 has been approved',
    timestamp: '1 day ago',
    read: true,
  },
]

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#4B6B7A] hover:text-[#0B1F33] transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#BFDBFE] rounded-xl shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DBEAFE]">
            <h3 className="font-semibold text-[#0B1F33]">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#4B6B7A] hover:text-[#0B1F33]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto text-[#DBEAFE] mb-2" size={32} />
                <p className="text-[#4B6B7A] text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#DBEAFE]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-[#F0F7FA] transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.read ? 'bg-[#DBEAFE]' : 'bg-[#0A8FA8]'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0B1F33] text-sm">{notification.title}</p>
                        <p className="text-xs text-[#4B6B7A] mt-1">{notification.message}</p>
                        <p className="text-xs text-[#94A3B8] mt-2">{notification.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <div className="border-t border-[#DBEAFE] px-4 py-3">
              <button
                onClick={markAllRead}
                className="w-full text-center text-xs font-medium text-[#0A8FA8] hover:text-[#088096] transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
