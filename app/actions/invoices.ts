'use server'

import {
  getInvoices,
  getInvoicesFiltered,
  getInvoiceById,
  createInvoice,
  sendInvoice,
  cancelInvoice,
  exportInvoicesToCSV,
} from '@/lib/services/invoices'
import {
  recordPayment,
  getPaymentsByInvoice,
  exportPaymentsToCSV,
} from '@/lib/services/payments'
import type {
  Invoice,
  InvoiceDetail,
  CreateInvoiceFormData,
  RecordPaymentFormData,
  Payment,
  InvoiceStatus,
} from '@/types/finance'

// Get all invoices
export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    return await getInvoices()
  } catch (error) {
    throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get filtered invoices
export async function fetchInvoicesFiltered(
  status?: InvoiceStatus,
  search?: string,
  limit?: number,
  offset?: number
): Promise<{ data: Invoice[]; total: number }> {
  try {
    return await getInvoicesFiltered(status, search, limit, offset)
  } catch (error) {
    throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get invoice detail
export async function fetchInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  try {
    return await getInvoiceById(id)
  } catch (error) {
    throw new Error(`Failed to fetch invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Create new invoice
export async function createInvoiceAction(formData: CreateInvoiceFormData): Promise<Invoice> {
  try {
    return await createInvoice(formData)
  } catch (error) {
    throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Send invoice
export async function sendInvoiceAction(invoiceId: string): Promise<void> {
  try {
    await sendInvoice(invoiceId)
  } catch (error) {
    throw new Error(`Failed to send invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Cancel invoice
export async function cancelInvoiceAction(invoiceId: string): Promise<void> {
  try {
    await cancelInvoice(invoiceId)
  } catch (error) {
    throw new Error(`Failed to cancel invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Record payment
export async function recordPaymentAction(formData: RecordPaymentFormData): Promise<Payment> {
  try {
    return await recordPayment(formData)
  } catch (error) {
    throw new Error(`Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get payments for invoice
export async function fetchPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  try {
    return await getPaymentsByInvoice(invoiceId)
  } catch (error) {
    throw new Error(`Failed to fetch payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Export invoices to CSV
export async function exportInvoicesAction(invoices: Invoice[]): Promise<string> {
  try {
    return await exportInvoicesToCSV(invoices)
  } catch (error) {
    throw new Error(`Failed to export invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Export payments to CSV
export async function exportPaymentsAction(payments: Payment[]): Promise<string> {
  try {
    return await exportPaymentsToCSV(payments)
  } catch (error) {
    throw new Error(`Failed to export payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
