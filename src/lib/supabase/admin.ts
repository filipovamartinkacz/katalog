import { createClient } from '@supabase/supabase-js'

// Používá service role klíč — jen na serveru, nikdy klientovi
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY není nastaven.')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
