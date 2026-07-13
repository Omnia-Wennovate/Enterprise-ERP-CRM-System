'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Medal, Trophy, Star, Clock, BookOpen, Award, Filter, EyeOff } from 'lucide-react'
import type { LeaderboardEntry } from '@/types/hr'

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'company' | 'department'>('company')
  const [department, setDepartment] = useState('Sales') // Default, could be pulled from user context
  const [optedOut, setOptedOut] = useState(false)

  useEffect(() => {
    loadLeaderboard()
  }, [view, department])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const { getCompanyLeaderboard, getDepartmentLeaderboard, isOptedOut } = await import('@/lib/services/learning-leaderboard')
      
      const [data, isOut] = await Promise.all([
        view === 'company' ? getCompanyLeaderboard() : getDepartmentLeaderboard(department),
        isOptedOut('CURRENT_USER_ID_PLACEHOLDER') // In a real app, pass the actual user ID
      ])
      
      setEntries(data)
      setOptedOut(isOut)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleOptOutToggle = async () => {
    try {
      const { toggleOptOut } = await import('@/lib/services/learning-leaderboard')
      await toggleOptOut('CURRENT_USER_ID_PLACEHOLDER', !optedOut)
      setOptedOut(!optedOut)
      loadLeaderboard() // Refresh to remove/add self
    } catch (err) {
      console.error('Failed to toggle opt out:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Medal className="w-6 h-6 text-amber-500" />
            Learning Leaderboard
          </h2>
          <p className="text-slate-500 text-sm mt-1">Recognizing top learners across the organization.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setView('company')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Company
            </button>
            <button
              onClick={() => setView('department')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'department' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Department
            </button>
          </div>

          <button 
            onClick={handleOptOutToggle}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
              optedOut ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={optedOut ? "You are hidden from the leaderboard" : "Hide yourself from the leaderboard"}
          >
            <EyeOff className="w-4 h-4" /> {optedOut ? 'Opted Out' : 'Opt Out'}
          </button>
        </div>
      </div>

      {/* Top 3 Podium (if we have enough data) */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 pt-8 pb-4 items-end">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-t-2xl border-t border-x border-slate-200/80 p-6 flex flex-col items-center relative shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] h-48 justify-end"
          >
            <div className="absolute -top-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-slate-300 shadow-lg flex items-center justify-center text-slate-500 font-bold text-xl overflow-hidden">
                {entries[1].avatar_url ? <img src={entries[1].avatar_url} alt="" className="w-full h-full object-cover" /> : entries[1].employee_name.charAt(0)}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-slate-700 font-bold -mt-4 shadow-sm">2</div>
            </div>
            <h3 className="font-bold text-slate-900 text-center line-clamp-1 mt-6">{entries[1].employee_name}</h3>
            <p className="text-xs text-slate-500 text-center line-clamp-1 mb-2">{entries[1].department}</p>
            <div className="flex items-center gap-1.5 font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" /> {entries[1].learning_hours}h
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-gradient-to-t from-teal-50 to-white rounded-t-2xl border-t border-x border-teal-200/80 p-6 flex flex-col items-center relative shadow-[0_-15px_30px_-15px_rgba(13,148,136,0.3)] h-56 justify-end z-10"
          >
            <div className="absolute -top-12 flex flex-col items-center">
              <Trophy className="w-8 h-8 text-amber-500 mb-2 drop-shadow-md" />
              <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-amber-400 shadow-xl flex items-center justify-center text-slate-500 font-bold text-2xl overflow-hidden">
                {entries[0].avatar_url ? <img src={entries[0].avatar_url} alt="" className="w-full h-full object-cover" /> : entries[0].employee_name.charAt(0)}
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-white font-bold -mt-4 shadow-sm">1</div>
            </div>
            <h3 className="font-bold text-slate-900 text-center line-clamp-1 mt-6">{entries[0].employee_name}</h3>
            <p className="text-xs text-slate-500 text-center line-clamp-1 mb-2">{entries[0].department}</p>
            <div className="flex items-center gap-1.5 font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" /> {entries[0].learning_hours}h
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-t-2xl border-t border-x border-slate-200/80 p-6 flex flex-col items-center relative shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] h-40 justify-end"
          >
            <div className="absolute -top-8 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-slate-200 border-4 border-amber-700/50 shadow-lg flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden">
                {entries[2].avatar_url ? <img src={entries[2].avatar_url} alt="" className="w-full h-full object-cover" /> : entries[2].employee_name.charAt(0)}
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-700/60 border-2 border-white flex items-center justify-center text-white font-bold -mt-3 shadow-sm text-sm">3</div>
            </div>
            <h3 className="font-bold text-slate-900 text-center line-clamp-1 mt-6 text-sm">{entries[2].employee_name}</h3>
            <p className="text-[10px] text-slate-500 text-center line-clamp-1 mb-2">{entries[2].department}</p>
            <div className="flex items-center gap-1.5 font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full text-sm">
              <Clock className="w-3 h-3" /> {entries[2].learning_hours}h
            </div>
          </motion.div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4 w-16 text-center">Rank</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4 text-center">Learning Hours</th>
              <th className="px-6 py-4 text-center">Courses Completed</th>
              <th className="px-6 py-4 text-center">Certificates</th>
              <th className="px-6 py-4 text-center">Avg Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded mx-auto w-4" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-24" />
                        <div className="h-2 bg-slate-100 rounded w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded mx-auto w-12" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded mx-auto w-8" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded mx-auto w-8" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded mx-auto w-12" /></td>
                </tr>
              ))
            ) : entries.length > 0 ? (
              entries.map((entry, i) => (
                <tr key={entry.employee_id} className={`hover:bg-slate-50 transition-colors ${i < 3 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-6 py-4 text-center font-bold text-slate-400">
                    #{entry.rank}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                        {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" /> : entry.employee_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{entry.employee_name}</p>
                        <p className="text-xs text-slate-500">{entry.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-900">
                      {entry.learning_hours}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    {entry.courses_completed}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    {entry.certificates_earned}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5 font-medium text-slate-900">
                      {entry.avg_score > 0 ? (
                        <>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {entry.avg_score}%
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <Medal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No leaderboard data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
