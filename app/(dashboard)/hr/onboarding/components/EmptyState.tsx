'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Users } from 'lucide-react'
import Link from 'next/link'

interface Props {
  onStartOnboarding: () => void
}

export function EmptyState({ onStartOnboarding }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div className="w-20 h-20 rounded-2xl bg-omnia-gold/15 dark:bg-teal-900/30 flex items-center justify-center mb-6">
        <UserPlus className="w-10 h-10 text-omnia-gold" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">No Active Onboardings</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6 text-sm leading-relaxed">
        Start your first employee onboarding and track every step from orientation to completion.
        The system will guide you through creating a comprehensive onboarding plan.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onStartOnboarding}
          className="flex items-center gap-2 px-5 py-2.5 bg-omnia-gold text-white rounded-xl hover:bg-omnia-gold-dark transition-colors font-semibold shadow-lg shadow-teal-600/20"
        >
          <UserPlus className="w-5 h-5" />
          Start Onboarding
        </button>
        <Link
          href="/hr/employees"
          className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium border border-border"
        >
          <Users className="w-5 h-5" />
          View Employees
        </Link>
      </div>
    </motion.div>
  )
}
