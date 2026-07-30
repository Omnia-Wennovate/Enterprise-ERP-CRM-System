import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectCredential, CredentialAccessLog } from '@/types/tech'

// ============================================================================
// CREDENTIAL VAULT SERVICES
// ============================================================================

// The vault key is passed from the client (stored in env var NEXT_PUBLIC_VAULT_KEY)
// In production, use a server-side API route for decryption

export async function getProjectCredentials(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_credentials')
    .select('id, project_id, credential_name, credential_type, username, environment, created_by, last_updated_by, expiry_date, is_active, notes, created_at, updated_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ProjectCredential[]
}

export async function getAllCredentials(filters?: {
  projectId?: string
  type?: string
  environment?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('project_credentials')
    .select('id, project_id, credential_name, credential_type, username, environment, created_by, last_updated_by, expiry_date, is_active, notes, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (filters?.projectId && filters.projectId !== 'all') {
    query = query.eq('project_id', filters.projectId)
  }
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('credential_type', filters.type)
  }
  if (filters?.environment && filters.environment !== 'all') {
    query = query.eq('environment', filters.environment)
  }
  if (filters?.search) {
    query = query.ilike('credential_name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  // Enrich with project names
  if (data && data.length > 0) {
    const projectIds = [...new Set(data.map((c: any) => c.project_id))]
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)

    const projectMap = new Map((projects || []).map((p: any) => [p.id, p.name]))

    const creatorIds = [...new Set(data.map((c: any) => c.created_by).filter(Boolean))]
    let profileMap = new Map()
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', creatorIds)
      profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]))
    }

    return data.map((c: any) => ({
      ...c,
      project_name: projectMap.get(c.project_id) || 'Unknown',
      created_by_name: profileMap.get(c.created_by) || '',
    })) as ProjectCredential[]
  }

  return data as ProjectCredential[]
}

export async function createCredential(
  projectId: string,
  credential: {
    credential_name: string
    credential_type: string
    username?: string
    secret: string
    environment?: string
    expiry_date?: string
    notes?: string
  },
  userId: string,
  vaultKey: string
) {
  const supabase = createClient()

  // Encrypt the secret using the RPC function
  const { data: encryptedData, error: encryptError } = await supabase.rpc('encrypt_credential', {
    secret_text: credential.secret,
    vault_key: vaultKey,
  })

  if (encryptError) throw encryptError

  const { data, error } = await supabase
    .from('project_credentials')
    .insert({
      project_id: projectId,
      credential_name: credential.credential_name,
      credential_type: credential.credential_type,
      username: credential.username,
      encrypted_secret: encryptedData,
      environment: credential.environment || 'production',
      expiry_date: credential.expiry_date || null,
      notes: credential.notes,
      created_by: userId,
      last_updated_by: userId,
    })
    .select('id, project_id, credential_name, credential_type, username, environment, created_by, expiry_date, is_active, notes, created_at, updated_at')
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_credentials', data.id, userId, null, {
    ...data,
    encrypted_secret: '[ENCRYPTED]',
  })

  // Log access
  await supabase.from('credential_access_log').insert({
    credential_id: data.id,
    accessed_by: userId,
    action: 'create',
  })

  return data as ProjectCredential
}

export async function revealCredential(
  credentialId: string,
  userId: string,
  vaultKey: string
): Promise<string> {
  const supabase = createClient()

  // Call the RPC function which checks permissions and logs access
  const { data, error } = await supabase.rpc('decrypt_credential', {
    p_credential_id: credentialId,
    vault_key: vaultKey,
  })

  if (error) throw error
  return data as string
}

export async function rotateCredential(
  credentialId: string,
  newSecret: string,
  userId: string,
  vaultKey: string
) {
  const supabase = createClient()

  // Encrypt new secret
  const { data: encryptedData, error: encryptError } = await supabase.rpc('encrypt_credential', {
    secret_text: newSecret,
    vault_key: vaultKey,
  })

  if (encryptError) throw encryptError

  const { data, error } = await supabase
    .from('project_credentials')
    .update({
      encrypted_secret: encryptedData,
      last_updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .select('id, project_id, credential_name, credential_type, username, environment, created_by, expiry_date, is_active, notes, created_at, updated_at')
    .single()

  if (error) throw error

  await logTechAudit('ROTATE', 'project_credentials', credentialId, userId, null, {
    ...data,
    encrypted_secret: '[ROTATED]',
  })

  // Log access
  await supabase.from('credential_access_log').insert({
    credential_id: credentialId,
    accessed_by: userId,
    action: 'rotate',
  })

  return data as ProjectCredential
}

export async function deleteCredential(credentialId: string, userId: string) {
  const supabase = createClient()

  // Log before deleting
  await supabase.from('credential_access_log').insert({
    credential_id: credentialId,
    accessed_by: userId,
    action: 'delete',
  })

  const { error } = await supabase
    .from('project_credentials')
    .delete()
    .eq('id', credentialId)

  if (error) throw error
  await logTechAudit('DELETE', 'project_credentials', credentialId, userId, null, null)
}

export async function getCredentialAccessLog(credentialId?: string, limit = 50) {
  const supabase = createClient()
  let query = supabase
    .from('credential_access_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (credentialId) {
    query = query.eq('credential_id', credentialId)
  }

  const { data, error } = await query
  if (error) throw error

  // Enrich with names
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map((l: any) => l.accessed_by))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]))

    const credentialIds = [...new Set(data.map((l: any) => l.credential_id))]
    const { data: creds } = await supabase
      .from('project_credentials')
      .select('id, credential_name')
      .in('id', credentialIds)

    const credMap = new Map((creds || []).map((c: any) => [c.id, c.credential_name]))

    return data.map((l: any) => ({
      ...l,
      accessed_by_name: profileMap.get(l.accessed_by) || 'Unknown',
      credential_name: credMap.get(l.credential_id) || 'Unknown',
    })) as CredentialAccessLog[]
  }

  return data as CredentialAccessLog[]
}

export async function getExpiringCredentials(daysAhead = 30) {
  const supabase = createClient()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const { data, error } = await supabase
    .from('project_credentials')
    .select('id, project_id, credential_name, credential_type, expiry_date, is_active')
    .eq('is_active', true)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', futureDate.toISOString())
    .order('expiry_date', { ascending: true })

  if (error) throw error
  return data as ProjectCredential[]
}
