const { Client } = require('pg')

const client = new Client({
  user: 'postgres',
  password: 'password', // Supabase local dev password
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres'
})

async function test() {
  try {
    await client.connect()
    const res = await client.query(`
      SELECT pol.policyname, pol.permissive, pol.roles, pol.cmd, pol.qual, pol.with_check 
      FROM pg_policies pol 
      WHERE pol.tablename = 'expenses';
    `)
    console.log('Policies:', res.rows)
    
    const rls = await client.query(`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE relname = 'expenses';
    `)
    console.log('RLS Enabled:', rls.rows[0]?.relrowsecurity)
    
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}
test()
