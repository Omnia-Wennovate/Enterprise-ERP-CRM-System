import { createClient } from '@/lib/supabase/client'
import type { SocialLead } from '@/types/marketing'


// ============================================================================
// SOCIAL LEADS CRUD
// ============================================================================

export async function getSocialLeads(filters?: {
  status?: string
  platform?: string
  campaign_id?: string
  assigned_agent_id?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('social_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.platform) query = query.eq('platform', filters.platform)
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)
  if (filters?.assigned_agent_id) query = query.eq('assigned_agent_id', filters.assigned_agent_id)

  const { data, error } = await query
  if (error) throw error
  return data as SocialLead[]
}

export async function getSocialLeadById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialLead
}

export async function createSocialLead(lead: Partial<SocialLead>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_leads')
    .insert(lead)
    .select()
    .single()

  if (error) throw error

  // Update campaign lead count if campaign_id exists
  if (lead.campaign_id) {
    const { count } = await supabase
      .from('social_leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', lead.campaign_id)

    await supabase
      .from('social_campaigns')
      .update({ actual_leads: count || 0 })
      .eq('id', lead.campaign_id)
  }

  return data as SocialLead
}

export async function updateSocialLead(id: string, updates: Partial<SocialLead>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialLead
}

export async function deleteSocialLead(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('social_leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function convertLead(id: string) {
  const supabase = createClient()
  return updateSocialLead(id, {
    status: 'converted',
    converted: true,
  })
}

export async function assignLeadToAgent(leadId: string, agentId: string) {
  const supabase = createClient()
  return updateSocialLead(leadId, {
    assigned_agent_id: agentId,
    status: 'contacted',
  })
}

export async function getLeadCountsByStatus() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_leads')
    .select('status')

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(l => {
    counts[l.status] = (counts[l.status] || 0) + 1
  })
  return counts
}

export async function getLeadCountsByPlatform() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_leads')
    .select('platform')

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(l => {
    counts[l.platform] = (counts[l.platform] || 0) + 1
  })
  return counts
}
