'use server'

import { createClient } from '@/lib/supabase/server'

export async function logAccess(
  documentId: string,
  userId: string,
  action: string,
  bookingId?: string | null,
  ipAddress?: string | null,
  deviceInfo?: string | null,
  notes?: string | null
): Promise<void> {
  const supabase = await createClient()
  
  await supabase.from('document_access_log').insert([{
    document_id: documentId,
    accessed_by: userId,
    action,
    booking_id: bookingId,
    ip_address: ipAddress,
    device_info: deviceInfo,
    notes,
  }])
}

export async function getAccessLog(documentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('document_access_log')
    .select(`
      *,
      profiles!document_access_log_accessed_by_fkey(full_name)
    `)
    .eq('document_id', documentId)
    .order('accessed_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch access log: ${error.message}`)
  
  return (data || []).map(log => ({
    ...log,
    accessed_by_name: (log as any).profiles?.full_name
  }))
}

// Stub for secure token generation, would use a secure signed URL library in a real app
export async function generateSecureDownloadToken(documentId: string, userId: string): Promise<string> {
  // In a real implementation this would generate a signed URL with a short expiration
  // For now we just return a simple hash
  const token = Buffer.from(`${documentId}:${userId}:${Date.now()}`).toString('base64')
  
  await logAccess(documentId, userId, 'share', null, null, null, `Generated secure token: ${token}`)
  
  return token
}
