import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, autoConfirm } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: autoConfirm || true,
      user_metadata: {
        role: extractRoleFromEmail(email),
        first_name: extractFirstNameFromEmail(email),
      },
    })

    if (error) {
      console.error('[v0] Supabase user creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[v0] User created successfully:', data.user?.id)

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
  } catch (err) {
    console.error('[v0] API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

function extractRoleFromEmail(email: string): string {
  if (email.includes('admin')) return 'super_admin'
  if (email.includes('sales')) return 'sales_agent'
  if (email.includes('ops')) return 'operations'
  if (email.includes('finance')) return 'accountant'
  if (email.includes('hr')) return 'hr_manager'
  if (email.includes('customer')) return 'customer'
  return 'customer'
}

function extractFirstNameFromEmail(email: string): string {
  const names: { [key: string]: string } = {
    admin: 'Admin',
    sales: 'Sales',
    ops: 'Operations',
    finance: 'Finance',
    hr: 'HR',
    customer: 'Customer',
  }

  for (const [key, name] of Object.entries(names)) {
    if (email.includes(key)) return name
  }

  return 'User'
}
