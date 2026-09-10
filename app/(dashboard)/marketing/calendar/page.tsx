'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/context/profile-context'
import type { SocialPost } from '@/types/marketing'
import { PLATFORM_COLORS } from '@/types/marketing'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPostsByDateRange } from '@/lib/services/social-posts'

export default function CalendarPage() {
  const router = useRouter()
  const profile = useProfile()
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [view, setView] = useState<'month' | 'week'>('month')

  useEffect(() => {
    loadPosts()
  }, [currentDate])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1).toISOString()
      const end = new Date(year, month + 1, 0).toISOString()
      const data = await getPostsByDateRange(start, end)
      setPosts(data)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const navigateMonth = (dir: number) => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const adjustedFirst = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < adjustedFirst; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  const getPostsForDay = (day: number) => {
    return posts.filter(p => {
      const pDate = p.scheduled_for ? new Date(p.scheduled_for) : p.published_at ? new Date(p.published_at) : null
      if (!pDate) return false
      return pDate.getDate() === day && pDate.getMonth() === month && pDate.getFullYear() === year
    })
  }

  const today = new Date()
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  const statusColors: Record<string, string> = {
    draft: '#6B7280', pending_approval: '#F59E0B', approved: '#10B981',
    scheduled: '#3B82F6', published: '#22C55E', archived: '#9CA3AF',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
              <p className="text-sm text-muted-foreground mt-1">Visual overview of scheduled and published content</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-card rounded-lg border border-border overflow-hidden">
                <button onClick={() => setView('month')} className={`px-3 py-1.5 text-xs font-medium ${view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Month</button>
                <button onClick={() => setView('week')} className={`px-3 py-1.5 text-xs font-medium ${view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Week</button>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-background text-muted-foreground"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-semibold text-foreground">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-background text-muted-foreground"><ChevronRight size={20} /></button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
            ) : (
              <div className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={i} className="min-h-[100px] bg-muted rounded-lg" />
                    const dayPosts = getPostsForDay(day)
                    return (
                      <div
                        key={i}
                        className={`min-h-[100px] rounded-lg border p-2 transition-all hover:shadow-sm cursor-pointer ${
                          isToday(day) ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                        onClick={() => router.push('/marketing/content')}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 3).map((post, j) => (
                            <div
                              key={j}
                              className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                              style={{
                                backgroundColor: `${statusColors[post.status] || '#6B7280'}15`,
                                color: statusColors[post.status] || '#6B7280',
                              }}
                            >
                              {post.content_type}: {post.caption?.substring(0, 20) || 'Untitled'}
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <div className="text-[10px] text-muted-foreground text-center">+{dayPosts.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Status Legend</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-muted-foreground capitalize">{status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
    </div>
  )
}
