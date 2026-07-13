import { createClient } from '@/lib/supabase/client'

// ============================================================================
// SOCIAL ACCOUNTS CRUD
// ============================================================================

export async function getSocialAccounts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .order('platform', { ascending: true })

  if (error) throw error
  return data as SocialAccount[]
}

export async function getSocialAccountById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialAccount
}

export async function createSocialAccount(account: Partial<SocialAccount>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .insert(account)
    .select()
    .single()

  if (error) throw error
  return data as SocialAccount
}

export async function updateSocialAccount(id: string, updates: Partial<SocialAccount>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialAccount
}

export async function deleteSocialAccount(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function syncAccountStatus(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .update({
      last_sync_at: new Date().toISOString(),
      api_status: 'active',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialAccount
}

export async function getAccountsByPlatform(platform: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('platform', platform)
    .order('account_name', { ascending: true })

  if (error) throw error
  return data as SocialAccount[]
}

export async function getTotalFollowers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('followers_count')
    .eq('status', 'connected')

  if (error) throw error
  return (data || []).reduce((sum, a) => sum + (a.followers_count || 0), 0)
}
