'use server'

import { createClient } from '@/lib/supabase/server'

export interface PeriodLock {
  id: string
  period_month: number
  period_year: number
  locked_by: string | null
  locked_at: string
  unlocked_by: string | null
  unlocked_at: string | null
  unlock_reason: string | null
  is_locked: boolean
}

export async function getPeriodLocks(): Promise<PeriodLock[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('finance_period_locks')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
  return data || []
}

export async function isPeriodLocked(month: number, year: number): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('finance_period_locks')
    .select('is_locked')
    .eq('period_month', month)
    .eq('period_year', year)
    .single()
  return data?.is_locked === true
}

export async function lockPeriod(month: number, year: number): Promise<void> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { error } = await supabase
    .from('finance_period_locks')
    .upsert({
      period_month: month,
      period_year: year,
      locked_by: user?.id ?? null,
      locked_at: new Date().toISOString(),
      is_locked: true,
      unlocked_at: null,
      unlocked_by: null,
      unlock_reason: null,
    }, { onConflict: 'period_month,period_year' })

  if (error) throw new Error(`Failed to lock period: ${error.message}`)
}

export async function unlockPeriod(month: number, year: number, reason: string): Promise<void> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { error } = await supabase
    .from('finance_period_locks')
    .update({
      is_locked: false,
      unlocked_by: user?.id ?? null,
      unlocked_at: new Date().toISOString(),
      unlock_reason: reason,
    })
    .eq('period_month', month)
    .eq('period_year', year)

  if (error) throw new Error(`Failed to unlock period: ${error.message}`)
}

/**
 * Check if a record's date falls within a locked period.
 * Returns the lock if locked, null if not.
 */
export async function checkRecordInLockedPeriod(dateStr: string): Promise<PeriodLock | null> {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const year = d.getFullYear()

  const supabase = await createClient()
  const { data } = await supabase
    .from('finance_period_locks')
    .select('*')
    .eq('period_month', month)
    .eq('period_year', year)
    .eq('is_locked', true)
    .single()

  return data || null
}
