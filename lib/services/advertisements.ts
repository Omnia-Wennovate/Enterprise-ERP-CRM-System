import { createClient } from '@/lib/supabase/client'
import type { Advertisement, AdvertisementMetric } from '@/types/marketing'


// ============================================================================
// ADVERTISEMENTS CRUD
// ============================================================================

export async function getAdvertisements(filters?: {
  platform?: string
  status?: string
  campaign_id?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('advertisements')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.platform) query = query.eq('platform', filters.platform)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)

  const { data, error } = await query
  if (error) throw error
  return data as Advertisement[]
}

export async function getAdvertisementById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Advertisement
}

export async function createAdvertisement(ad: Partial<Advertisement>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisements')
    .insert(ad)
    .select()
    .single()

  if (error) throw error
  return data as Advertisement
}

export async function updateAdvertisement(id: string, updates: Partial<Advertisement>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Advertisement
}

export async function deleteAdvertisement(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('advertisements')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// ADVERTISEMENT METRICS
// ============================================================================

export async function recordAdMetric(metric: Partial<AdvertisementMetric>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisement_metrics')
    .insert(metric)
    .select()
    .single()

  if (error) throw error

  // Update ad spend
  if (metric.advertisement_id) {
    const { data: metrics } = await supabase
      .from('advertisement_metrics')
      .select('clicks, cpc')
      .eq('advertisement_id', metric.advertisement_id)

    const totalSpend = (metrics || []).reduce((sum, m) => {
      return sum + ((m.clicks || 0) * (m.cpc || 0))
    }, 0)

    await supabase
      .from('advertisements')
      .update({ spend: totalSpend })
      .eq('id', metric.advertisement_id)
  }

  return data as AdvertisementMetric
}

export async function getAdMetrics(adId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisement_metrics')
    .select('*')
    .eq('advertisement_id', adId)
    .order('date', { ascending: true })

  if (error) throw error
  return data as AdvertisementMetric[]
}

export async function getAdMetricsSummary(adId: string) {
  const supabase = createClient()
  const metrics = await getAdMetrics(adId)
  if (metrics.length === 0) {
    return { totalImpressions: 0, totalClicks: 0, avgCTR: 0, avgCPC: 0, avgCPM: 0, totalConversions: 0, avgROI: 0 }
  }

  const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0)
  const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0)
  const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0)
  const avgCTR = metrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / metrics.length
  const avgCPC = metrics.reduce((sum, m) => sum + (m.cpc || 0), 0) / metrics.length
  const avgCPM = metrics.reduce((sum, m) => sum + (m.cpm || 0), 0) / metrics.length
  const avgROI = metrics.reduce((sum, m) => sum + (m.roi || 0), 0) / metrics.length

  return { totalImpressions, totalClicks, avgCTR, avgCPC, avgCPM, totalConversions, avgROI }
}

export async function getTotalAdSpend() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisements')
    .select('spend')

  if (error) throw error
  return (data || []).reduce((sum, a) => sum + (a.spend || 0), 0)
}

export async function getTotalAdBudget() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('advertisements')
    .select('budget')

  if (error) throw error
  return (data || []).reduce((sum, a) => sum + (a.budget || 0), 0)
}
