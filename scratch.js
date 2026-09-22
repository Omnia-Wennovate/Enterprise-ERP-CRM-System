import { createExpense, getExpensesWithRelations } from './lib/services/expenses.ts'
// We cannot easily run next.js server code outside Next environment due to dependencies.
// Let's create a small script that directly inserts an expense via fetch or simulates it.
