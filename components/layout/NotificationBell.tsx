'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X } from 'lucide-react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/services/lead-notifications'
import type { AppNotification } from '@/types/leads'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [])

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    fetchNotifications().finally(() => setIsLoading(false))
  }, [fetchNotifications])

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Refresh when panel opens
  useEffect(() => {
    if (isOpen) fetchNotifications()
  }, [isOpen, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    try {
      await markNotificationRead(id)
    } catch {
      // Revert on failure
      fetchNotifications()
    }
  }

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      fetchNotifications()
    }
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
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[#4B6B7A] text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
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
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.is_read ? 'bg-[#DBEAFE]' : 'bg-[#0A8FA8]'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0B1F33] text-sm">{notification.title}</p>
                        <p className="text-xs text-[#4B6B7A] mt-1">{notification.message}</p>
                        <p className="text-xs text-[#94A3B8] mt-2">
                          {timeAgo(notification.created_at)}
                        </p>
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
                onClick={handleMarkAllRead}
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
