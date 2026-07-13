import { createClient } from '@/lib/supabase/client'
import type { SocialCampaign, CampaignPlatform } from '@/types/marketing'


// ============================================================================
// CAMPAIGNS CRUD
// ============================================================================

export async function getCampaigns(filters?: {
  status?: string
  campaign_type?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('social_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.campaign_type) query = query.eq('campaign_type', filters.campaign_type)

  const { data, error } = await query
  if (error) throw error
  return data as SocialCampaign[]
}

export async function getCampaignById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialCampaign
}

export async function createCampaign(campaign: Partial<SocialCampaign>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_campaigns')
    .insert(campaign)
    .select()
    .single()

  if (error) throw error
  return data as SocialCampaign
}

export async function updateCampaign(id: string, updates: Partial<SocialCampaign>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialCampaign
}

export async function deleteCampaign(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('social_campaigns')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// CAMPAIGN PLATFORMS
// ============================================================================

export async function assignPlatformToCampaign(campaignId: string, accountId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('campaign_platforms')
    .insert({ campaign_id: campaignId, account_id: accountId })
    .select()
    .single()

  if (error) throw error
  return data as CampaignPlatform
}

export async function removePlatformFromCampaign(campaignId: string, accountId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('campaign_platforms')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('account_id', accountId)

  if (error) throw error
}

export async function getCampaignPlatforms(campaignId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('campaign_platforms')
    .select('*, social_accounts(*)')
    .eq('campaign_id', campaignId)

  if (error) throw error
  return data
}

// ============================================================================
// CAMPAIGN ANALYTICS
// ============================================================================

export async function updateCampaignLeadCount(campaignId: string) {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('social_leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (error) throw error

  await supabase
    .from('social_campaigns')
    .update({ actual_leads: count || 0 })
    .eq('id', campaignId)
}

export async function calculateCampaignROI(campaignId: string) {
  const supabase = createClient()
  const campaign = await getCampaignById(campaignId)
  if (!campaign || !campaign.budget || campaign.budget === 0) return null

  // Simple ROI: ((leads * estimated value) - budget) / budget * 100
  const estimatedLeadValue = 500 // Default lead value
  const revenue = (campaign.actual_leads || 0) * estimatedLeadValue
  const roi = ((revenue - campaign.budget) / campaign.budget) * 100

  await supabase
    .from('social_campaigns')
    .update({ roi: Math.round(roi * 100) / 100 })
    .eq('id', campaignId)

  return roi
}

export async function getActiveCampaigns() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: true })

  if (error) throw error
  return data as SocialCampaign[]
}

export async function getCampaignCountsByStatus() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_campaigns')
    .select('status')

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(c => {
    counts[c.status] = (counts[c.status] || 0) + 1
  })
  return counts
}
