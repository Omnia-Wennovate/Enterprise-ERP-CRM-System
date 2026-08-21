'use client'

import Image from 'next/image'

interface OmniaLogoProps {
  /** 'full' = logo + text, 'icon' = logo only */
  variant?: 'full' | 'icon'
  /** 'light' = white text (for dark backgrounds), 'dark' = dark text (for light backgrounds) */
  theme?: 'light' | 'dark'
  /** Height of the logo in pixels */
  size?: number
  className?: string
}

export function OmniaLogo({ 
  variant = 'full', 
  theme = 'dark', 
  size = 40, 
  className = '' 
}: OmniaLogoProps) {
  const imageSrc = theme === 'light' ? '/omnia-logo-light.png' : '/omnia-logo.png'
  
  // The official Omnia logo (globe + airplane + text) is roughly square
  const width = variant === 'full' ? size * 2.5 : size

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ height: size, width: width }}>
      <Image 
        src={imageSrc}
        alt="Omnia Business and Leisure Travel"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
