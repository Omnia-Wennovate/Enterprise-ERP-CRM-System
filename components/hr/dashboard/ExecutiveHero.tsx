'use client'

import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'

interface ExecutiveHeroProps {
  userName: string
  companyName: string
  summary: string
}

export function ExecutiveHero({ userName, companyName, summary }: ExecutiveHeroProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-blue-900 text-white shadow-xl mb-6"
    >
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 bg-repeat bg-center"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
      
      <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-foreground/80 mb-2 font-medium">
            <Building2 className="w-5 h-5" />
            <span>{companyName}</span>
            <span className="mx-2">•</span>
            <span>{currentDate}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            {getGreeting()}, {userName} <span className="animate-wave inline-block origin-bottom-right">👋</span>
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl leading-relaxed bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            {summary}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
