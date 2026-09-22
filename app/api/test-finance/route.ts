import { NextResponse } from 'next/server'
import * as expenseSvc from '@/lib/services/expenses'

export async function GET() {
  try {
    const res = await expenseSvc.getExpensesWithRelations({
      limit: 50,
      offset: 0
    })
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
