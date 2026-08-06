'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, Loader2, CheckCircle } from 'lucide-react'

export function ExecutiveBriefingExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    
    // Simulate PDF generation delay
    setTimeout(() => {
      setIsExporting(false)
      setIsSuccess(true)
      
      // Reset success state after a few seconds
      setTimeout(() => setIsSuccess(false), 3000)
    }, 2000)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleExport}
      disabled={isExporting || isSuccess}
      className={`flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl border-2 transition-all font-semibold shadow-sm
        ${isSuccess 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
          : 'bg-card border-border hover:border-primary/50 text-foreground'
        }`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Generating Board Report PDF...</span>
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle className="w-5 h-5" />
          <span>Report Generated Successfully!</span>
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5 text-primary" />
          <span>One-Click Executive Briefing Export</span>
        </>
      )}
    </motion.button>
  )
}
