'use client'

import { useState, useEffect } from 'react'
import { Plus, Hash, Lock, Users, MessageSquare, AlertCircle, Clock, Search } from 'lucide-react'
import Link from 'next/link'
import { getDepartmentConfig, getChannelDepartment } from '@/lib/department-config'
import { getChannelsForUser, createChannelAction, type ChannelWithMeta } from '../actions'
import { cn } from '@/lib/utils'

// ─── Create Channel Dialog ────────────────────────────────────────────────────
function CreateChannelDialog({
  profileId,
  onCreated,
  onClose,
}: {
  profileId: string
  onCreated: () => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setErr(null)
    try {
      await createChannelAction({ name, description, is_private: isPrivate, createdBy: profileId })
      onCreated()
      onClose()
    } catch (e: any) {
      setErr(e.message || 'Failed to create channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create Channel</h2>
          <p className="text-sm text-muted-foreground mt-1">Set up a new collaboration space</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Channel Name</label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                placeholder="e.g. project-alpha"
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 focus:border-omnia-gold text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel for?"
              rows={2}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 focus:border-omnia-gold text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPrivate((v) => !v)}
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors',
                isPrivate ? 'bg-omnia-gold' : 'bg-muted'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                isPrivate ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">Private channel</p>
              <p className="text-xs text-muted-foreground">Only invited members can join</p>
            </div>
          </div>
          {err && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {err}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-lg text-sm font-medium hover:bg-omnia-gold-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({ channel }: { channel: ChannelWithMeta }) {
  const deptKey = getChannelDepartment(channel.name)
  const deptConfig = getDepartmentConfig(deptKey)

  function relativeTime(ts: string | null): string | null {
    if (!ts) return null
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <Link
      href={`/communication/channels/${channel.id}`}
      className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-omnia-gold/20 transition-all group overflow-hidden"
    >
      {/* Department accent top stripe */}
      <div className="h-0.5" style={{ backgroundColor: deptConfig.accent }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-omnia-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-omnia-gold/15 transition-colors">
            {channel.is_private ? (
              <Lock className="w-6 h-6 text-omnia-gold" />
            ) : (
              <Hash className="w-6 h-6 text-omnia-gold" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">#{channel.name}</h3>
              {channel.is_private && (
                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">Private</span>
              )}
              {channel.unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                  {channel.unreadCount} new
                </span>
              )}
            </div>
            {channel.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">{channel.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {channel.memberCount} members
              </span>
              {channel.lastMessage && (
                <span className="flex items-center gap-1 truncate">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate max-w-32">{channel.lastMessage}</span>
                </span>
              )}
              {channel.lastMessageAt && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {relativeTime(channel.lastMessageAt)}
                </span>
              )}
            </div>
            {/* Dept accent dot */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deptConfig.accent }} />
              <span className="text-xs text-muted-foreground">{deptConfig.label}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('employee')
  const [userDepartment, setUserDepartment] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        setProfileId(user.id || null)
        setUserRole(user.role || 'employee')
        setUserDepartment(user.department || null)
      }
    } catch {
      setError('Unable to load user profile.')
      setLoading(false)
    }
  }, [])

  const loadChannels = () => {
    if (!profileId) return
    setLoading(true)
    getChannelsForUser(profileId, userDepartment)
      .then(setChannels)
      .catch(() => setError('Failed to load channels.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadChannels() }, [profileId, userDepartment])

  const isAdmin = userRole === 'super_admin' || userRole === 'admin'

  const filtered = channels.filter((c) =>
    c.name.includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Channels</h1>
            <p className="text-muted-foreground mt-1">Team collaboration workspaces</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Channel
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels…"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 focus:border-omnia-gold text-sm bg-card"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-muted rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {searchQuery ? 'No channels match your search' : 'No channels available'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search term.'
                : isAdmin
                ? 'Create the first channel to get the team collaborating.'
                : 'No department channels are available to you yet.'}
            </p>
            {isAdmin && !searchQuery && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-5 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm"
              >
                Create First Channel
              </button>
            )}
          </div>
        )}

        {/* Channel Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </div>

      {/* Create Channel Dialog */}
      {showCreate && profileId && (
        <CreateChannelDialog
          profileId={profileId}
          onCreated={loadChannels}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
