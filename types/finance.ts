// Phase 4: Finance ERP Types

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_money'
export type ExpenseCategory = 'office' | 'marketing' | 'travel_cost' | 'utilities' | 'other'
export type SupplierPaymentStatus = 'pending' | 'paid' | 'overdue'
export type CommissionStatus = 'pending' | 'approved' | 'paid'
export type CommissionRuleType = 'percentage' | 'flat'
export type CommissionAppliesTo = 'profit' | 'revenue'
export type CancellationRequestStatus = 'requested' | 'approved' | 'rejected' | 'processed'
export type RefundStatus = 'pending' | 'approved' | 'paid' | 'rejected'

// ============================================================================
// INVOICES & PAYMENTS
// ============================================================================

export interface Invoice {
  id: string
  invoice_number: string
  booking_id: string
  customer_id: string
  amount: number
  tax: number
  total_amount: number
  status: InvoiceStatus
  due_date: string
  issued_date: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface InvoiceDetail extends Invoice {
  line_items: InvoiceLineItem[]
  payments: Payment[]
  outstanding_balance: number
  customer_name?: string
  booking_reference?: string
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number?: string
  recorded_by?: string
  notes?: string
  created_at: string
}

// ============================================================================
// EXPENSES & SUPPLIER PAYMENTS
// ============================================================================

export interface Expense {
  id: string
  booking_id?: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  recorded_by?: string
  receipt_url?: string
  created_at: string
}

export interface SupplierPayment {
  id: string
  supplier_id: string
  booking_id?: string
  amount: number
  status: SupplierPaymentStatus
  due_date?: string
  paid_date?: string
  payment_method?: string
  reference_number?: string
  recorded_by?: string
  created_at: string
  supplier_name?: string
}

export interface ProfitCalculation {
  total_revenue: number
  total_cost: number
  expenses_total: number
  supplier_payments_total: number
  true_profit: number
}

// ============================================================================
// COMMISSIONS
// ============================================================================

export interface CommissionRule {
  id: string
  role: string
  rule_type: CommissionRuleType
  rate: number
  applies_to: CommissionAppliesTo
  is_active: boolean
  created_at: string
}

export interface Commission {
  id: string
  booking_id: string
  agent_id: string
  rule_id?: string
  base_amount: number
  commission_amount: number
  status: CommissionStatus
  period_month: number
  period_year: number
  created_at: string
  agent_name?: string
  booking_reference?: string
}

export interface CommissionStatement {
  agent_id: string
  agent_name: string
  period_month: number
  period_year: number
  total_base_amount: number
  total_commission: number
  status_breakdown: {
    pending: number
    approved: number
    paid: number
  }
  commissions: Commission[]
}

// ============================================================================
// CANCELLATIONS & REFUNDS
// ============================================================================

export interface CancellationRequest {
  id: string
  booking_id: string
  requested_by: string
  reason: string
  status: CancellationRequestStatus
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
}

export interface Refund {
  id: string
  cancellation_id: string
  invoice_id: string
  refund_amount: number
  supplier_penalty: number
  net_refund: number
  status: RefundStatus
  approved_by?: string
  paid_date?: string
  notes?: string
  created_at: string
  customer_name?: string
  cancellation_reason?: string
}

export interface RefundDetail extends Refund {
  booking_reference?: string
  invoice_number?: string
  original_invoice_total?: number
  payments_received?: number
}

// ============================================================================
// FORM TYPES FOR VALIDATION
// ============================================================================

export interface CreateInvoiceFormData {
  booking_id: string
  amount: number
  tax: number
  due_date: string
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'line_total'>[]
}

export interface RecordPaymentFormData {
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number?: string
  notes?: string
}

export interface AddExpenseFormData {
  booking_id?: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  receipt_url?: string
}

export interface MarkSupplierPaymentFormData {
  supplier_payment_id: string
  payment_date: string
  payment_method: string
  reference_number?: string
}

export interface CreateCancellationFormData {
  booking_id: string
  reason: string
}

export interface ProcessRefundFormData {
  cancellation_id: string
  invoice_id: string
  refund_amount: number
  supplier_penalty: number
  notes?: string
}
