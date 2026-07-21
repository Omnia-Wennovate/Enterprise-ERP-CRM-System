import { createClient } from '@/lib/supabase/client'
import type {
  LeadRow,
  LeadWithAgent,
  LeadFormData,
  LeadPipelineStage,
  SalesAgent,
} from '@/types/leads'

// ============================================================================
// CREATE LEAD
// ============================================================================

export async function createLead(data: LeadFormData, createdBy?: string): Promise<LeadRow> {
  const supabase = createClient()

  const insertData: Record<string, unknown> = {
    lead_name: data.lead_name,
    company: data.company || null,
    contact_person: data.contact_person || null,
    job_title: data.job_title || null,
    email: data.email,
    phone: data.phone || null,
    mobile: data.mobile || null,
    website: data.website || null,
    lead_source: data.lead_source,
    industry: data.industry || null,
    country: data.country || null,
    city: data.city || null,
    address: data.address || null,
    notes: data.notes || null,
    assigned_to: data.assigned_to && !data.assigned_to.startsWith('user_') ? data.assigned_to : null,
    estimated_value: data.estimated_value,
    currency: data.currency,
    travel_type: data.travel_type || null,
    expected_close_date: data.expected_close_date,
    priority: data.priority,
    pipeline_stage: data.pipeline_stage,
    probability: data.probability,
    status: data.status,
    destination: data.destination || null,
    travel_date: data.travel_date || null,
    return_date: data.return_date || null,
    adults: data.adults,
    children: data.children,
    infants: data.infants,
    budget: data.budget || null,
    preferred_airline: data.preferred_airline || null,
    preferred_hotel: data.preferred_hotel || null,
    visa_required: data.visa_required,
    special_requests: data.special_requests || null,
    tags: data.tags,
    created_by: createdBy || null,
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  return lead as LeadRow
}

// ============================================================================
// GET ALL LEADS (for Kanban)
// ============================================================================

export async function getLeads(): Promise<LeadWithAgent[]> {
  const supabase = createClient()

  // Try with join first, fallback to plain select
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch agent names separately for reliability
  const leads = (data || []) as LeadRow[]
  const agentIds = [...new Set(leads.map((l) => l.assigned_to).filter(Boolean))] as string[]
  
  let agentsMap: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {}
  if (agentIds.length > 0) {
    const { data: agents } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', agentIds)
    if (agents) {
      agentsMap = Object.fromEntries(agents.map((a) => [a.id, a]))
    }
  }

  return leads.map((lead) => ({
    ...lead,
    assigned_agent: lead.assigned_to ? agentsMap[lead.assigned_to] || null : null,
  })) as LeadWithAgent[]
}

// ============================================================================
// GET LEAD BY ID
// ============================================================================

export async function getLeadById(id: string): Promise<LeadWithAgent | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  if (!data) return null

  const lead = data as LeadRow
  let assigned_agent = null
  if (lead.assigned_to) {
    const { data: agent } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', lead.assigned_to)
      .single()
    assigned_agent = agent || null
  }

  return { ...lead, assigned_agent } as LeadWithAgent
}

// ============================================================================
// UPDATE LEAD
// ============================================================================

export async function updateLead(
  id: string,
  data: Partial<LeadFormData>
): Promise<LeadRow> {
  const supabase = createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return lead as LeadRow
}

// ============================================================================
// UPDATE PIPELINE STAGE (Kanban drag-drop)
// ============================================================================

export async function updateLeadStage(
  id: string,
  stage: LeadPipelineStage
): Promise<LeadRow> {
  const supabase = createClient()

  const probabilityMap: Record<LeadPipelineStage, number> = {
    new: 10,
    qualified: 30,
    proposal: 50,
    negotiation: 70,
    won: 100,
    lost: 0,
  }

  const { data, error } = await supabase
    .from('leads')
    .update({
      pipeline_stage: stage,
      probability: probabilityMap[stage],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LeadRow
}

// ============================================================================
// DELETE / ARCHIVE LEAD
// ============================================================================

export async function archiveLead(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// GET SALES AGENTS (for dropdown)
// ============================================================================

export async function getSalesAgents(): Promise<SalesAgent[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, role, avatar_url')
      .order('full_name')

    if (!error && data && data.length > 0) {
      return data as SalesAgent[]
    }
  } catch (err) {
    console.warn('Failed to fetch profiles, using demo agents', err)
  }

  // Fallback if query fails or returns empty
  return [
    { id: 'user_sales', full_name: 'Sales Agent (Demo)', first_name: 'Sales', last_name: 'Agent', role: 'sales_agent', avatar_url: null },
    { id: 'user_admin', full_name: 'Admin User (Demo)', first_name: 'Admin', last_name: 'User', role: 'admin', avatar_url: null }
  ]
}

// ============================================================================
// GET LEAD STATS (for dashboard)
// ============================================================================

export interface LeadStats {
  totalLeads: number
  pipelineValue: number
  wonValue: number
  conversionRate: number
  leadsByStage: Record<LeadPipelineStage, number>
}

export async function getLeadStats(): Promise<LeadStats> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('leads')
    .select('id, pipeline_stage, estimated_value, status')
    .eq('status', 'active')

  if (error) throw error

  const leads = data || []
  const totalLeads = leads.length
  const pipelineValue = leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
  const wonLeads = leads.filter((l) => l.pipeline_stage === 'won')
  const wonValue = wonLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0

  const leadsByStage = leads.reduce(
    (acc, l) => {
      const stage = l.pipeline_stage as LeadPipelineStage
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    },
    {
      new: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    } as Record<LeadPipelineStage, number>
  )

  return { totalLeads, pipelineValue, wonValue, conversionRate, leadsByStage }
}
