'use server'

import { createClient } from '@/lib/supabase/server'

export async function getThemePreferences(profileId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('theme_preference, chart_colorblind_safe')
    .eq('id', profileId)
    .single()

  if (error) {
    console.error('Failed to fetch theme preferences:', error)
    return null
  }
  return data
}

export async function updateThemePreferences(
  profileId: string,
  preferences: { theme_preference?: string; chart_colorblind_safe?: boolean }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update(preferences)
    .eq('id', profileId)

  if (error) {
    console.error('Failed to update theme preferences:', error)
    throw new Error('Failed to update theme preferences')
  }
}
