'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TrainingSession } from '@/types/hr'

export function TrainingCalendar() {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    loadSessions()
  }, [currentDate.getMonth(), currentDate.getFullYear()])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const { getSessions } = await import('@/lib/services/training-calendar')
      const data = await getSessions({ 
        month: currentDate.getMonth() + 1, 
        year: currentDate.getFullYear() 
      })
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  const nextMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Basic calendar math
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-md text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-900 w-32 text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-md text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium text-teal-600 hover:text-teal-700">
            Today
          </button>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm shadow-teal-600/20">
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() &&
                              currentDate.getFullYear() === new Date().getFullYear()

              // Find sessions for this day
              const daySessions = day ? sessions.filter(s => {
                const sessionDate = new Date(s.start_time)
                return sessionDate.getDate() === day
              }) : []

              return (
                <div 
                  key={i} 
                  className={`min-h-[120px] p-2 border-b border-r border-slate-100 relative ${!day ? 'bg-slate-50/50' : 'hover:bg-slate-50/50 transition-colors group'}`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        isToday ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700'
                      }`}>
                        {day}
                      </div>
                      
                      <div className="space-y-1">
                        {daySessions.map(session => (
                          <div 
                            key={session.id} 
                            className="px-2 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-[10px] rounded-md truncate cursor-pointer hover:bg-teal-100 transition-colors"
                            title={session.title}
                          >
                            {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {session.title}
                          </div>
                        ))}
                      </div>

                      {/* Add button on hover */}
                      <button className="absolute bottom-2 right-2 p-1 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-teal-600 hover:border-teal-200 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
              Upcoming Sessions
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-semibold">{sessions.length}</span>
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {sessions.map(session => (
                  <div key={session.id} className="p-3 border border-slate-100 rounded-lg hover:border-teal-200 transition-colors group cursor-pointer">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">{session.title}</h4>
                    
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(session.start_time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {session.current_attendees} / {session.max_attendees || '∞'} enrolled
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-500">
                No sessions scheduled for this month.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
