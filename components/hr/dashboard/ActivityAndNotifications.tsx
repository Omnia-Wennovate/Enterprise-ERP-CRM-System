'use client'

import { motion } from 'framer-motion'
import { Bell, Activity, UserPlus, CheckCircle, FileText, Monitor, Target } from 'lucide-react'

export function ActivityAndNotifications() {
  const activities = [
    { id: 1, type: 'join', text: 'Sarah Jenkins joined the Sales department', time: '10 mins ago', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 2, type: 'leave', text: 'Mark D. leave request approved', time: '1 hour ago', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 3, type: 'payroll', text: 'July payroll generated successfully', time: '3 hours ago', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 4, type: 'asset', text: 'MacBook Pro assigned to New Hire', time: '5 hours ago', icon: Monitor, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 5, type: 'performance', text: 'Q2 Performance Reviews completed', time: '1 day ago', icon: Target, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ]

  const notifications = [
    { id: 1, text: '3 Leave requests pending approval', urgent: true },
    { id: 2, text: '2 Birthdays today (Marketing Dept)', urgent: false },
    { id: 3, text: 'Expiring contract: Chen W. (in 15 days)', urgent: true },
    { id: 4, text: 'Payroll due for review in 4 days', urgent: false },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      
      {/* Activity Center */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col h-[400px]">
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Activity Center</h3>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activities.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-4 relative"
            >
              {/* Timeline line */}
              {idx !== activities.length - 1 && (
                <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-border"></div>
              )}
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${item.bg} ${item.color} shadow-sm border border-border/30`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="pt-2 flex-1">
                <p className="text-sm font-medium text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Notification Center */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col h-[400px]">
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-foreground">Notification Center</h3>
          </div>
          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
            {notifications.length} New
          </span>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {notifications.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-xl border transition-colors cursor-pointer hover:shadow-md ${
                item.urgent 
                ? 'border-red-200 bg-red-50/50 hover:bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 dark:hover:bg-red-900/20' 
                : 'border-border/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className={`text-sm font-medium ${item.urgent ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>
                  {item.text}
                </p>
                {item.urgent && (
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
    </div>
  )
}
