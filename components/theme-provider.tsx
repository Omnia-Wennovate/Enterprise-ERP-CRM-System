"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { updateThemePreferences, getThemePreferences } from "@/lib/services/theme"

type EnhancedThemeContextType = {
  themePreference: string // 'light', 'dark', 'system', 'light+contrast', 'dark+contrast', 'system+contrast'
  setThemePreference: (pref: string) => void
  isColorblindSafe: boolean
  setColorblindSafe: (safe: boolean) => void
}

export const EnhancedThemeContext = React.createContext<EnhancedThemeContextType | undefined>(undefined)

export function useEnhancedTheme() {
  const context = React.useContext(EnhancedThemeContext)
  if (!context) throw new Error('useEnhancedTheme must be used within ThemeProvider')
  return context
}

function ThemeManager({ children }: { children: React.ReactNode }) {
  const { setTheme } = useNextTheme()
  const [themePreference, setThemePreferenceState] = React.useState('system')
  const [isColorblindSafe, setColorblindSafeState] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // On mount, sync from local storage and DB
  React.useEffect(() => {
    setMounted(true)
    const storedPref = localStorage.getItem('theme_preference')
    if (storedPref) {
      setThemePreferenceState(storedPref)
      setTheme(storedPref.replace('+contrast', ''))
    }
    const storedCb = localStorage.getItem('chart_colorblind_safe')
    if (storedCb) setColorblindSafeState(storedCb === 'true')

    const authUser = localStorage.getItem('auth_user')
    if (authUser) {
      try {
        const profile = JSON.parse(authUser)
        if (profile?.id) {
          getThemePreferences(profile.id).then(data => {
            if (data) {
              const pref = data.theme_preference || 'system'
              const cb = data.chart_colorblind_safe || false
              setThemePreferenceState(pref)
              setColorblindSafeState(cb)
              setTheme(pref.replace('+contrast', ''))
              localStorage.setItem('theme_preference', pref)
              localStorage.setItem('chart_colorblind_safe', cb.toString())
            }
          })
        }
      } catch (e) {
        console.error('Failed to parse auth user for theme sync', e)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    
    if (themePreference.includes('+contrast')) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (isColorblindSafe) {
      root.classList.add('colorblind-safe')
    } else {
      root.classList.remove('colorblind-safe')
    }
  }, [themePreference, isColorblindSafe, mounted])

  const setThemePreference = (pref: string) => {
    setThemePreferenceState(pref)
    setTheme(pref.replace('+contrast', ''))
    localStorage.setItem('theme_preference', pref)
    
    const authUser = localStorage.getItem('auth_user')
    if (authUser) {
      try {
        const profile = JSON.parse(authUser)
        if (profile?.id) {
          updateThemePreferences(profile.id, { theme_preference: pref }).catch(console.error)
        }
      } catch (e) {}
    }
  }

  const setColorblindSafe = (safe: boolean) => {
    setColorblindSafeState(safe)
    localStorage.setItem('chart_colorblind_safe', safe.toString())

    const authUser = localStorage.getItem('auth_user')
    if (authUser) {
      try {
        const profile = JSON.parse(authUser)
        if (profile?.id) {
          updateThemePreferences(profile.id, { chart_colorblind_safe: safe }).catch(console.error)
        }
      } catch (e) {}
    }
  }

  return (
    <EnhancedThemeContext.Provider value={{ themePreference, setThemePreference, isColorblindSafe, setColorblindSafe }}>
      {children}
    </EnhancedThemeContext.Provider>
  )
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeManager>
        {children}
      </ThemeManager>
    </NextThemesProvider>
  )
}
