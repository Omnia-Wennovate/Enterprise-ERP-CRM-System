import { createClient } from '@/lib/supabase/client'
import type { Influencer } from '@/types/marketing'


export async function getInfluencers(filters?: {
  platform?: string
  campaign_id?: string
  status?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('influencers')
    .select('*')
    .order('followers_count', { ascending: false })

  if (filters?.platform) query = query.eq('platform', filters.platform)
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as Influencer[]
}

export async function getInfluencerById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Influencer
}

export async function createInfluencer(influencer: Partial<Influencer>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('influencers')
    .insert(influencer)
    .select()
    .single()

  if (error) throw error
  return data as Influencer
}

export async function updateInfluencer(id: string, updates: Partial<Influencer>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('influencers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Influencer
}

export async function deleteInfluencer(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('influencers')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getTotalInfluencerSpend() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('influencers')
    .select('payment_amount')
    .eq('payment_status', 'paid')

  if (error) throw error
  return (data || []).reduce((sum, i) => sum + (i.payment_amount || 0), 0)
}
