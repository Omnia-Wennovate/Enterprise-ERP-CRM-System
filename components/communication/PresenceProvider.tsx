'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateUserPresence } from '@/app/(dashboard)/communication/actions'

// ─── Context ──────────────────────────────────────────────────────────────────

interface PresenceContextValue {
  onlineUserIds: Set<string>
  awayUserIds: Set<string>
  getStatus: (userId: string) => 'online' | 'away' | 'offline'
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  awayUserIds: new Set(),
  getStatus: () => 'offline',
})

export function usePresence() {
  return useContext(PresenceContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PresenceProviderProps {
  profileId: string | null
  children: React.ReactNode
}

export function PresenceProvider({ profileId, children }: PresenceProviderProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [awayUserIds, setAwayUserIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!profileId) return

    // Update DB presence on mount
    updateUserPresence(profileId, 'online').catch(console.error)

    // Subscribe to Supabase Realtime Presence
    const channel = supabase.channel('communication:presence', {
      config: { presence: { key: profileId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ status: string }>()
        const online = new Set<string>()
        const away = new Set<string>()

        for (const [key, presences] of Object.entries(state)) {
          const latest = (presences as any[])[0]
          if (latest?.status === 'online') online.add(key)
          else if (latest?.status === 'away') away.add(key)
        }

        setOnlineUserIds(online)
        setAwayUserIds(away)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ status: 'online', user_id: profileId })
        }
      })

    channelRef.current = channel

    // Tab visibility → away/online
    const handleVisibility = () => {
      if (!channelRef.current) return
      if (document.hidden) {
        channelRef.current.track({ status: 'away', user_id: profileId })
        updateUserPresence(profileId, 'away').catch(console.error)
      } else {
        channelRef.current.track({ status: 'online', user_id: profileId })
        updateUserPresence(profileId, 'online').catch(console.error)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    // Heartbeat — keep last_seen_at fresh every 4 minutes
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        updateUserPresence(profileId, 'online').catch(console.error)
      }
    }, 4 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(heartbeat)
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      updateUserPresence(profileId, 'offline').catch(console.error)
    }
  }, [profileId])

  const getStatus = (userId: string): 'online' | 'away' | 'offline' => {
    if (onlineUserIds.has(userId)) return 'online'
    if (awayUserIds.has(userId)) return 'away'
    return 'offline'
  }

  return (
    <PresenceContext.Provider value={{ onlineUserIds, awayUserIds, getStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
