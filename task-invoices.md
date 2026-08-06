# Enterprise Invoice Dashboard — Task List

## Phase 1: Data Layer
- [ ] Create lib/services/invoice-dashboard.ts (KPI engine, charts, aging, leaderboard, health)
- [ ] Fix lib/services/invoices.ts (createClient bug)
- [ ] Extend lib/utils/expense-pdf.ts (add buildInvoiceCoverPage + buildBoardReportPage)
- [ ] Update app/actions/invoices.ts (async wrappers for new functions)

## Phase 2: Core Components
- [ ] Create app/(dashboard)/finance/invoices/components/PeriodSelector.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceKPICard.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/HealthScore.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/ExecutiveSummary.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/EmptyState.tsx

## Phase 3: Dashboard Components
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceCharts.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceDashboard.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/BoardReportButton.tsx

## Phase 4: Table & Drawer
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceTable.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceDetailDrawer.tsx

## Phase 5: Supplementary Views
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceAgingDashboard.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/CustomerLeaderboard.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/InvoiceCalendar.tsx
- [ ] Create app/(dashboard)/finance/invoices/components/ActivityFeed.tsx

## Phase 6: Main Page
- [ ] Replace app/(dashboard)/finance/invoices/page.tsx

## Phase 7: Verification
- [ ] TypeScript check — zero errors in invoice module
