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

// Enterprise Expense Types
export type ExpenseStatus = 'unpaid' | 'paid' | 'reimbursed' | 'cancelled' | 'archived'
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'not_required'
export type ExpensePaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_money' | 'check' | 'online'
export type ExpenseApproverRole = 'Department Manager' | 'Finance Officer' | 'Finance Manager' | 'Director'

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
  currency: string
  exchange_rate: number
  discount: number
  priority: string
  tags: string[]
  quotation_id?: string
  is_recurring: boolean
  recurrence_frequency?: string
  approval_status: string
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
  discount_percent?: number
  tax_percent?: number
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
  bank_reconciled?: boolean
  recorded_by?: string
  notes?: string
  status?: string
  created_at: string
}

export interface InvoiceApproval {
  id: string
  invoice_id: string
  approver_role: string
  approver_id?: string
  status: string
  comments?: string
  approved_at?: string
  created_at: string
}

export interface CreditNote {
  id: string
  original_invoice_id: string
  credit_number: string
  amount: number
  reason?: string
  issued_by?: string
  created_at: string
}

export interface BankTransaction {
  id: string
  transaction_date: string
  description?: string
  amount: number
  matched_payment_id?: string
  status: string
  uploaded_by?: string
  created_at: string
}

export interface FinanceSettings {
  id: string
  approval_threshold_amount: number
  updated_by?: string
  updated_at: string
}

// ============================================================================
// EXPENSES & SUPPLIER PAYMENTS
// ============================================================================

export interface Expense {
  id: string
  booking_id?: string
  category: string
  description: string
  amount: number
  expense_date: string
  recorded_by?: string
  receipt_url?: string
  created_at: string
  // Enterprise fields
  expense_number?: string
  vendor_id?: string
  currency?: string
  exchange_rate?: number
  tax?: number
  discount?: number
  approval_status?: ExpenseApprovalStatus
  status?: ExpenseStatus
  department?: string
  project?: string
  payment_method?: ExpensePaymentMethod
  payment_reference?: string
  receipt_hash?: string
  ai_extracted_data?: Record<string, unknown>
  policy_exceeded?: boolean
  notes?: string
  employee_id?: string
  updated_at?: string
  original_currency?: string
  original_amount?: number
}

export interface ExpenseWithRelations extends Expense {
  vendor_name?: string
  employee_name?: string
  booking_reference?: string
  attachment_count?: number
}

export interface Vendor {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  tax_number?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  // computed
  total_paid?: number
  total_expenses?: number
  last_transaction?: string
}

export interface ExpenseCategoryConfig {
  id: string
  name: string
  icon?: string
  monthly_limit?: number
  per_transaction_limit?: number
  daily_per_person_limit?: number
  is_active: boolean
  created_at: string
}

export interface ExpenseAttachment {
  id: string
  expense_id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  file_hash?: string
  page_order: number
  uploaded_by?: string
  created_at: string
  uploaded_by_name?: string
}

export interface ExpenseApproval {
  id: string
  expense_id: string
  step: number
  approver_role: string
  approver_id?: string
  status: string
  comments?: string
  approved_at?: string
  created_at: string
  approver_name?: string
}

export interface ExpenseBudget {
  id: string
  department?: string
  category?: string
  period_month: number
  period_year: number
  budget_amount: number
  created_at: string
  // computed
  spent?: number
  remaining?: number
  utilization_percent?: number
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  department?: string
  project?: string
  booking_id?: string
  split_amount: number
  split_percent?: number
  created_at: string
}

export interface ExpenseKPIs {
  total_amount: number
  total_records: number
  monthly_amount: number
  today_amount: number
  pending_approval: number
  approved: number
  rejected: number
  paid: number
  unpaid: number
  reimbursed: number
  average_expense: number
  largest_expense: number
  budget_total: number
  budget_remaining: number
  budget_utilization_percent: number
  tax_deductible_amount: number
}

export interface ExpenseChartData {
  monthly: Array<{ month: string; amount: number }>
  by_category: Array<{ category: string; amount: number }>
  by_department: Array<{ department: string; amount: number }>
  by_vendor: Array<{ vendor: string; amount: number }>
  by_payment_method: Array<{ method: string; amount: number }>
  budget_vs_actual: Array<{ period: string; budget: number; actual: number }>
}

export interface CreateExpenseFormData {
  expense_date: string
  vendor_id?: string
  employee_id?: string
  department?: string
  project?: string
  category: string
  booking_id?: string
  description: string
  amount: number
  tax?: number
  discount?: number
  currency: string
  exchange_rate?: number
  original_currency?: string
  original_amount?: number
  payment_method?: ExpensePaymentMethod
  payment_reference?: string
  status?: ExpenseStatus
  approval_status?: ExpenseApprovalStatus
  notes?: string
  policy_exceeded?: boolean
  splits?: Array<{
    department?: string
    project?: string
    booking_id?: string
    split_amount: number
    split_percent?: number
  }>
}

export interface CreateVendorFormData {
  name: string
  contact_person?: string
  phone?: string
  email?: string
  tax_number?: string
  address?: string
}

export interface OCRExtractedData {
  vendor?: string
  amount?: number
  date?: string
  tax?: number
  currency?: string
  confidence: number
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
  customer_id: string
  amount: number
  tax: number
  discount: number
  due_date: string
  currency: string
  exchange_rate: number
  priority: string
  tags: string[]
  quotation_id?: string
  is_recurring: boolean
  recurrence_frequency?: string
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'line_total'>[]
  /** Client-provided user ID when Supabase session cookies are unavailable */
  created_by?: string
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
  category: string
  description: string
  amount: number
  expense_date: string
  receipt_url?: string
  // Legacy compat — kept for existing calls
}

export interface MarkSupplierPaymentFormData {
  supplier_payment_id: string
  payment_date: string
  payment_method: string
  reference_number?: string
}

// Supplier entity from the suppliers table
export interface Supplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  currency?: string
  created_at?: string
}

// Operations → Supplier Payments: form data for creating a new payment request
export interface CreateSupplierPaymentFormData {
  supplier_id: string
  supplier_name: string   // denormalized for display without joins
  amount: number
  currency?: string
  due_date?: string
  reference_number?: string
  booking_id?: string
  description?: string    // maps to notes/description if column exists
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

// ============================================================================
// PAYMENTS DASHBOARD — Enterprise 2026
// ============================================================================

export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded'

export interface PaymentAllocation {
  id: string
  payment_id: string
  invoice_id: string
  amount: number
  created_at: string
  // Joined
  invoice_number?: string
  invoice_total?: number
  invoice_remaining?: number
}

export interface PaymentWithRelations extends Payment {
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  invoice_number?: string
  invoice_total?: number
  invoice_currency?: string
  invoice_due_date?: string
  invoice_status?: string
  booking_id?: string
  booking_reference?: string
  booking_destination?: string
  recorded_by_name?: string
  paid_amount?: number
  remaining_amount?: number
  allocations?: PaymentAllocation[]
}

export interface PaymentKPIs {
  totalPayments: number
  totalCollected: number
  paymentsThisMonth: number
  paymentsThisWeek: number
  paymentsToday: number
  outstandingAmount: number
  collectionRate: number
  averagePayment: number
  largestPayment: number
  overdueAmount: number
  overdueInvoiceCount: number
  pendingPayments: number
  refundedAmount: number
  refundCount: number
  averagePaymentDays: number
  cashCollectedThisYear: number
  // Comparison
  prevTotalCollected: number
  prevTotalPayments: number
  prevOutstandingAmount: number
  prevCollectionRate: number
  prevAveragePayment: number
  periodLabel: string
  compareLabel: string
}

export interface PaymentChartData {
  collectionTrend: Array<{ date: string; amount: number; count: number }>
  byMethod: Array<{ method: string; amount: number; count: number; failureRate: number }>
  byCurrency: Array<{ currency: string; amount: number; count: number }>
  byStatus: Array<{ status: string; amount: number; count: number }>
  outstandingTrend: Array<{ date: string; outstanding: number }>
  agingBuckets: PaymentAgingBucket[]
  topCustomers: Array<{ customerId: string; customerName: string; totalPaid: number; paymentCount: number }>
  topAgents: Array<{ agentId: string; agentName: string; totalCollected: number; paymentCount: number }>
  monthlyCollection: Array<{ month: string; collected: number; outstanding: number; count: number }>
}

export interface PaymentAgingBucket {
  bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+'
  label: string
  totalAmount: number
  invoiceCount: number
  color: string
}

export interface CollectionHealthScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
  status: string
  factors: Array<{ label: string; score: number; weight: number; description: string }>
  recommendations: string[]
}

export interface PaymentFilter {
  search?: string
  status?: string
  paymentMethod?: string
  currency?: string
  customerId?: string
  agentId?: string
  invoiceId?: string
  bookingId?: string
  startDate?: string
  endDate?: string
  amountMin?: number
  amountMax?: number
  recordedBy?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CashFlowProjection {
  period: string
  expectedAmount: number
  confidenceLevel: number
  customerBreakdown: Array<{
    customerId: string
    customerName: string
    outstandingAmount: number
    expectedDate: string
    onTimeRate: number
  }>
}

export interface PaymentMethodReliability {
  method: string
  totalAttempts: number
  successCount: number
  failureCount: number
  failureRate: number
  totalAmount: number
  reliabilityScore: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface CollectionsIntelligence {
  largestPayment: { amount: number; customerName: string; date: string; invoiceNumber: string }
  largestCustomer: { customerName: string; totalPaid: number; paymentCount: number }
  fastestPayer: { customerName: string; avgDays: number; paymentCount: number }
  slowestPayer: { customerName: string; avgDays: number; paymentCount: number }
  mostOutstandingCustomer: { customerName: string; outstandingAmount: number; invoiceCount: number }
  highestCollectionCustomer: { customerName: string; collectionRate: number; totalInvoiced: number }
  paymentMethodLeader: { method: string; totalAmount: number; percentage: number }
}

export interface RecordPaymentFormDataV2 {
  customer_id?: string
  invoice_id?: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number?: string
  notes?: string
  currency?: string
  allocations?: Array<{ invoice_id: string; amount: number }>
}
