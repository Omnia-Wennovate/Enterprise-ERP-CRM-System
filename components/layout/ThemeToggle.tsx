"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Type } from "lucide-react"
import { useEnhancedTheme } from "./../theme-provider"

export function ThemeToggle() {
  const { themePreference, setThemePreference } = useEnhancedTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  // Close when clicking outside
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleHighContrast = () => {
    if (themePreference.includes('+contrast')) {
      setThemePreference(themePreference.replace('+contrast', ''))
    } else {
      setThemePreference(`${themePreference}+contrast`)
    }
  }

  const baseTheme = themePreference.replace('+contrast', '')

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-muted transition-colors relative"
        aria-label="Theme options"
      >
        <Sun className="h-5 w-5 text-muted-foreground transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50">
          <div className="py-1" role="menu">
            <button
              onClick={() => { setThemePreference(themePreference.includes('+contrast') ? 'light+contrast' : 'light'); setIsOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted ${baseTheme === 'light' ? 'text-primary' : 'text-foreground'}`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => { setThemePreference(themePreference.includes('+contrast') ? 'dark+contrast' : 'dark'); setIsOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted ${baseTheme === 'dark' ? 'text-primary' : 'text-foreground'}`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
            <button
              onClick={() => { setThemePreference(themePreference.includes('+contrast') ? 'system+contrast' : 'system'); setIsOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted ${baseTheme === 'system' ? 'text-primary' : 'text-foreground'}`}
            >
              <Monitor className="h-4 w-4" /> System
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => { toggleHighContrast(); setIsOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted ${themePreference.includes('+contrast') ? 'text-primary' : 'text-foreground'}`}
            >
              <Type className="h-4 w-4" /> High Contrast
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
