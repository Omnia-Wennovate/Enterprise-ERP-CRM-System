'use client'

import { motion } from 'framer-motion'
import { OmniaLogo } from '@/components/ui/OmniaLogo'

export function LoginLeftPanel() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
    >
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#050A15]/95 via-[#0A1221]/88 to-[#121E36]/92" />
      </div>

      {/* Gold decorative lines — enhanced luxury */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12] z-10" viewBox="0 0 500 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8A951" />
            <stop offset="50%" stopColor="#E8D48B" />
            <stop offset="100%" stopColor="#C8A951" />
          </linearGradient>
        </defs>
        <path d="M-50,150 Q150,60 350,200 T700,150" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" />
        <path d="M-50,300 Q200,200 400,350 T750,300" stroke="url(#goldGrad)" strokeWidth="1" fill="none" />
        <path d="M-50,450 Q100,400 300,500 T700,450" stroke="url(#goldGrad)" strokeWidth="0.8" fill="none" />
        <path d="M-50,600 Q250,550 400,650 T750,600" stroke="url(#goldGrad)" strokeWidth="0.6" fill="none" />
        <circle cx="420" cy="100" r="200" stroke="url(#goldGrad)" strokeWidth="0.5" fill="none" opacity="0.4" />
        <circle cx="60" cy="700" r="140" stroke="url(#goldGrad)" strokeWidth="0.5" fill="none" opacity="0.3" />
        <circle cx="350" cy="500" r="100" stroke="url(#goldGrad)" strokeWidth="0.3" fill="none" opacity="0.2" />
      </svg>

      {/* Content */}
      <div className="relative z-20 flex flex-col h-full justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          {/* Large logo with luxury glow */}
          <div className="relative mb-10">
            {/* Soft gold glow behind logo */}
            <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-b from-[#C8A951] to-transparent scale-150" />
            <OmniaLogo variant="full" theme="light" size={160} />
          </div>
          
          {/* Gold divider */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-[#C8A951] to-transparent mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-[#C8A951] text-xs font-bold tracking-[0.3em] uppercase mb-5">
              OMNIA TRAVEL
            </h2>
            <h1 className="text-white text-4xl xl:text-5xl font-semibold mb-5 leading-tight tracking-tight">
              Business &<br />Leisure Travel
            </h1>
            <p className="text-[#8A94A5] text-lg max-w-sm mx-auto font-light italic">
              Every thing omnia knows about one place
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom branding */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="relative z-20 mt-auto text-center"
        >
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#C8A951]/40 to-transparent mx-auto mb-4" />
          <p className="text-white/35 text-xs font-medium tracking-wider">
            &copy; 2026 Omnia Travel. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
