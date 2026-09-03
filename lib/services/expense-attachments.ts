'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpenseAttachment } from '@/types/finance'

// ── Compute simple hash of file (SHA-256 via Web Crypto if browser, else base64 of size+name) ──

function simpleHash(fileName: string, fileSize: number): string {
  // Deterministic fingerprint for duplicate detection
  return Buffer.from(`${fileName}:${fileSize}`).toString('base64').slice(0, 32)
}

// ── Upload attachment to Supabase Storage ─────────────────────────────────────

export async function uploadExpenseAttachment(
  expenseId: string,
  file: {
    name: string
    type: string
    size: number
    base64: string  // base64-encoded file content
  },
  pageOrder = 0
): Promise<ExpenseAttachment> {
  const supabase = await createClient()
  const userId = (await supabase.auth.getUser()).data.user?.id

  // Decode base64 to buffer
  const buffer = Buffer.from(file.base64, 'base64')
  const extension = file.name.split('.').pop() || 'bin'
  const storagePath = `${expenseId}/${Date.now()}-${pageOrder}.${extension}`

  // Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('expense-attachments')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) throw new Error(`Failed to upload file: ${storageError.message}`)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('expense-attachments')
    .getPublicUrl(storagePath)

  const fileHash = simpleHash(file.name, file.size)

  // Insert attachment record
  const { data, error } = await supabase
    .from('expense_attachments')
    .insert([{
      expense_id: expenseId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      file_hash: fileHash,
      page_order: pageOrder,
      uploaded_by: userId,
    }])
    .select()
    .single()

  if (error) throw new Error(`Failed to record attachment: ${error.message}`)
  return data
}

// ── Get attachments for expense ───────────────────────────────────────────────

export async function getExpenseAttachments(expenseId: string): Promise<ExpenseAttachment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_attachments')
    .select(`*, profiles!expense_attachments_uploaded_by_fkey(first_name, last_name)`)
    .eq('expense_id', expenseId)
    .order('page_order')

  if (error) throw new Error(`Failed to fetch attachments: ${error.message}`)

  return Promise.all((data || []).map(async (row: Record<string, unknown>) => {
    const profile = row.profiles as { first_name?: string; last_name?: string } | null
    
    // Attempt to get a signed URL for secure viewing if public URL fails or is private
    let signedUrl = row.file_url as string
    if (signedUrl) {
      const urlParts = signedUrl.split('/expense-attachments/')
      if (urlParts.length > 1) {
        const { data: signed } = await supabase.storage
          .from('expense-attachments')
          .createSignedUrl(urlParts[1], 3600) // 1 hour expiration
        
        if (signed?.signedUrl) {
          signedUrl = signed.signedUrl
        }
      }
    }

    return {
      ...row,
      file_url: signedUrl,
      uploaded_by_name: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
        : null,
    } as ExpenseAttachment
  }))
}

// ── Check for duplicate hash ──────────────────────────────────────────────────

export async function findDuplicateAttachment(
  fileName: string,
  fileSize: number
): Promise<{ expense_id: string; expense_number: string | null; expense_date: string } | null> {
  const supabase = await createClient()
  const fileHash = simpleHash(fileName, fileSize)

  const { data, error } = await supabase
    .from('expense_attachments')
    .select(`expense_id, expenses!expense_attachments_expense_id_fkey(expense_number, expense_date)`)
    .eq('file_hash', fileHash)
    .limit(1)
    .single()

  if (error || !data) return null

  const expense = data.expenses as { expense_number: string | null; expense_date: string } | null
  return {
    expense_id: data.expense_id,
    expense_number: expense?.expense_number ?? null,
    expense_date: expense?.expense_date ?? '',
  }
}

// ── Delete attachment ─────────────────────────────────────────────────────────

export async function deleteExpenseAttachment(attachmentId: string): Promise<void> {
  const supabase = await createClient()

  // Get file URL first
  const { data: attachment } = await supabase
    .from('expense_attachments')
    .select('file_url')
    .eq('id', attachmentId)
    .single()

  // Delete from storage (extract path from URL)
  if (attachment?.file_url) {
    const urlParts = attachment.file_url.split('/expense-attachments/')
    if (urlParts.length > 1) {
      await supabase.storage.from('expense-attachments').remove([urlParts[1]])
    }
  }

  const { error } = await supabase
    .from('expense_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) throw new Error(`Failed to delete attachment: ${error.message}`)
}

// ── Reorder pages ─────────────────────────────────────────────────────────────

export async function reorderAttachmentPages(
  attachmentIds: string[]
): Promise<void> {
  const supabase = await createClient()
  await Promise.all(
    attachmentIds.map((id, index) =>
      supabase
        .from('expense_attachments')
        .update({ page_order: index })
        .eq('id', id)
    )
  )
}
