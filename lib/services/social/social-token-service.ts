/**
 * Social Token Service
 * Server-side ONLY — never import from client components.
 *
 * Handles AES-256-GCM encryption/decryption of OAuth tokens.
 * Tokens are stored encrypted in Supabase and decrypted only
 * at sync time, server-side.
 */

import { createClient } from '@/lib/supabase/server'
import type { TokenSet } from './social-provider'

// ============================================================================
// ENCRYPTION / DECRYPTION
// Uses Node.js built-in crypto — no external package needed
// ============================================================================

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Generate with: openssl rand -hex 32')
  }
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte (64 hex character) value')
  }
  return key
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 */
export function encryptToken(plaintext: string): string {
  // Dynamic import to avoid bundling crypto in client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto')
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)           // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Encode as iv:authTag:ciphertext (all base64)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 */
export function decryptToken(encrypted: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto')
  const key = getEncryptionKey()
  const [ivB64, authTagB64, cipherB64] = encrypted.split(':')
  if (!ivB64 || !authTagB64 || !cipherB64) {
    throw new Error('Invalid encrypted token format')
  }
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(cipherB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}

// ============================================================================
// TOKEN STORAGE / RETRIEVAL
// ============================================================================

export interface StoredTokenSet {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scopes?: string[]
}

/**
 * Stores encrypted tokens for a social account.
 * Call server-side only (OAuth callback route).
 */
export async function storeEncryptedTokens(
  accountId: string,
  tokens: TokenSet
): Promise<void> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    access_token_encrypted: encryptToken(tokens.accessToken),
    scopes: tokens.scopes || null,
    updated_at: new Date().toISOString(),
  }

  if (tokens.refreshToken) {
    updates.refresh_token_encrypted = encryptToken(tokens.refreshToken)
  }

  if (tokens.expiresAt) {
    updates.token_expires_at = tokens.expiresAt.toISOString()
  }

  const { error } = await supabase
    .from('social_accounts')
    .update(updates)
    .eq('id', accountId)

  if (error) throw new Error(`Failed to store tokens: ${error.message}`)
}

/**
 * Retrieves and decrypts tokens for a social account.
 * Call server-side only (sync service).
 */
export async function getDecryptedTokens(accountId: string): Promise<StoredTokenSet> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('social_accounts')
    .select('access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes')
    .eq('id', accountId)
    .single()

  if (error || !data) {
    throw new Error(`Account not found or DB error: ${error?.message}`)
  }

  if (!data.access_token_encrypted) {
    throw new Error(`No access token stored for account ${accountId}`)
  }

  return {
    accessToken: decryptToken(data.access_token_encrypted),
    refreshToken: data.refresh_token_encrypted
      ? decryptToken(data.refresh_token_encrypted)
      : undefined,
    expiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
    scopes: data.scopes || undefined,
  }
}

/**
 * Clears stored tokens for a disconnected account.
 * Call server-side only (disconnect route).
 */
export async function clearEncryptedTokens(accountId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('social_accounts')
    .update({
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      scopes: null,
      connection_status: 'disconnected',
      last_sync_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)

  if (error) throw new Error(`Failed to clear tokens: ${error.message}`)
}

/**
 * Checks if the stored token is expired or about to expire (within 5 mins).
 */
export function isTokenExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false  // non-expiring token
  const bufferMs = 5 * 60 * 1000  // 5 minutes buffer
  return new Date().getTime() + bufferMs >= expiresAt.getTime()
}

/**
 * Updates access token after a successful refresh.
 */
export async function updateAccessToken(
  accountId: string,
  newAccessToken: string,
  newExpiresAt?: Date
): Promise<void> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    access_token_encrypted: encryptToken(newAccessToken),
    updated_at: new Date().toISOString(),
  }

  if (newExpiresAt) {
    updates.token_expires_at = newExpiresAt.toISOString()
  }

  const { error } = await supabase
    .from('social_accounts')
    .update(updates)
    .eq('id', accountId)

  if (error) throw new Error(`Failed to update access token: ${error.message}`)
}
