'use server'

import { revalidatePath } from 'next/cache'
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  type CustomerParams,
  type CustomerInput,
} from '@/lib/services/customers'
import { calculateAge } from '@/lib/utils/age'
import type { Customer } from '@/types'

export { calculateAge }

// ── Get Customers ─────────────────────────────────────────────────────────────

export async function getCustomersAction(
  params?: CustomerParams
): Promise<{ data: Customer[]; total: number }> {
  return getCustomers(params)
}

// ── Get Single Customer ───────────────────────────────────────────────────────

export async function getCustomerByIdAction(id: string): Promise<Customer | null> {
  return getCustomerById(id)
}

// ── Create Customer ───────────────────────────────────────────────────────────

export async function createCustomerAction(
  input: CustomerInput
): Promise<{ success: true; customer: Customer } | { success: false; error: string }> {
  try {
    const customer = await createCustomer(input)
    revalidatePath('/crm/customers')
    return { success: true, customer }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create customer'
    return { success: false, error: message }
  }
}

// ── Update Customer ───────────────────────────────────────────────────────────

export async function updateCustomerAction(
  id: string,
  input: Partial<CustomerInput>
): Promise<{ success: true; customer: Customer } | { success: false; error: string }> {
  try {
    const customer = await updateCustomer(id, input)
    revalidatePath('/crm/customers')
    return { success: true, customer }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update customer'
    return { success: false, error: message }
  }
}

// ── Archive Customer ──────────────────────────────────────────────────────────

export async function archiveCustomerAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await archiveCustomer(id)
    revalidatePath('/crm/customers')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to archive customer'
    return { success: false, error: message }
  }
}
